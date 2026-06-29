"""
Redis-based session store for ML service.
Replaces in-memory sessions with persistent Redis storage.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional

import structlog

logger = structlog.get_logger()

# ── Redis Configuration ────────────────────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "3600"))  # default 1 hour

# Fallback to in-memory if Redis not available
_use_redis = True
_redis_client = None

try:
    import redis
    _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    # Test connection
    _redis_client.ping()
    logger.info("redis_connected", url=REDIS_URL)
except Exception as e:
    _use_redis = False
    _redis_client = None
    logger.warning("redis_unavailable",
        error=str(e),
        fallback="in-memory",
        hint="Set REDIS_URL or ensure Redis is running"
    )


class SessionStore:
    """
    Unified session store that uses Redis when available,
    falls back to in-memory storage otherwise.
    """

    def __init__(self, ttl_seconds: int = SESSION_TTL_SECONDS):
        self.ttl_seconds = ttl_seconds
        self._memory_store: Dict[str, Any] = {}
        self._memory_timestamps: Dict[str, float] = {}

    def _make_key(self, session_key: str, suffix: str = "") -> str:
        """Create Redis key with optional suffix."""
        base = f"session:{session_key}"
        return f"{base}:{suffix}" if suffix else base

    def get(self, session_key: str) -> Optional[Dict[str, Any]]:
        """Get session data."""
        if _use_redis and _redis_client:
            try:
                key = self._make_key(session_key)
                data = _redis_client.get(key)
                if data:
                    # Update last access time
                    _redis_client.expire(key, self.ttl_seconds)
                    return json.loads(data)
                return None
            except Exception as e:
                logger.error("redis_get_failed",
                    session_key=session_key,
                    error=str(e)
                )
                # Fall back to memory
                return self._memory_store.get(session_key)
        else:
            return self._memory_store.get(session_key)

    def set(self, session_key: str, data: Dict[str, Any]) -> None:
        """Set session data with TTL."""
        if _use_redis and _redis_client:
            try:
                key = self._make_key(session_key)
                _redis_client.setex(
                    key,
                    self.ttl_seconds,
                    json.dumps(data, default=str)
                )
                logger.debug("session_stored_redis",
                    session_key=session_key,
                    ttl=self.ttl_seconds
                )
            except Exception as e:
                logger.error("redis_set_failed",
                    session_key=session_key,
                    error=str(e)
                )
                # Fall back to memory
                self._memory_store[session_key] = data
                self._memory_timestamps[session_key] = time.time()
        else:
            self._memory_store[session_key] = data
            self._memory_timestamps[session_key] = time.time()

    def delete(self, session_key: str) -> None:
        """Delete session data."""
        if _use_redis and _redis_client:
            try:
                key = self._make_key(session_key)
                _redis_client.delete(key)
                # Also delete related keys (windows, etc.)
                pattern = self._make_key(session_key, "*")
                for match in _redis_client.scan_iter(match=pattern):
                    _redis_client.delete(match)
            except Exception as e:
                logger.error("redis_delete_failed",
                    session_key=session_key,
                    error=str(e)
                )

        # Also clear from memory fallback
        self._memory_store.pop(session_key, None)
        self._memory_timestamps.pop(session_key, None)

    def touch(self, session_key: str) -> None:
        """Update session last access time."""
        if _use_redis and _redis_client:
            try:
                key = self._make_key(session_key)
                _redis_client.expire(key, self.ttl_seconds)
            except Exception as e:
                logger.error("redis_touch_failed",
                    session_key=session_key,
                    error=str(e)
                )

        self._memory_timestamps[session_key] = time.time()

    def exists(self, session_key: str) -> bool:
        """Check if session exists."""
        if _use_redis and _redis_client:
            try:
                key = self._make_key(session_key)
                return _redis_client.exists(key) > 0
            except Exception as e:
                logger.error("redis_exists_failed",
                    session_key=session_key,
                    error=str(e)
                )

        return session_key in self._memory_store

    def get_all_keys(self) -> List[str]:
        """Get all active session keys (for monitoring)."""
        if _use_redis and _redis_client:
            try:
                keys = []
                for key in _redis_client.scan_iter(match="session:*"):
                    # Extract session key from "session:xxx"
                    parts = key.split(":")
                    if len(parts) >= 2:
                        keys.append(parts[1])
                return keys
            except Exception as e:
                logger.error("redis_scan_failed", error=str(e))

        return list(self._memory_store.keys())

    def count(self) -> int:
        """Get number of active sessions."""
        if _use_redis and _redis_client:
            try:
                count = 0
                for _ in _redis_client.scan_iter(match="session:*"):
                    count += 1
                return count
            except Exception as e:
                logger.error("redis_count_failed", error=str(e))

        return len(self._memory_store)

    def cleanup_expired(self) -> int:
        """
        Clean up expired sessions.
        Note: Redis handles TTL automatically, this is for in-memory fallback.
        """
        if _use_redis and _redis_client:
            # Redis handles TTL automatically
            return 0

        # In-memory cleanup
        current_time = time.time()
        expired = [
            key for key, ts in self._memory_timestamps.items()
            if current_time - ts > self.ttl_seconds
        ]

        for key in expired:
            self._memory_store.pop(key, None)
            self._memory_timestamps.pop(key, None)

        if expired:
            logger.info("memory_session_cleanup", expired_count=len(expired))

        return len(expired)


class SessionWindowStore:
    """
    Store for frame windows (used in live prediction).
    Stores list of frames per session.
    """

    def __init__(self, ttl_seconds: int = SESSION_TTL_SECONDS, max_window: int = 45):
        self.ttl_seconds = ttl_seconds
        self.max_window = max_window
        self._memory_windows: Dict[str, List[Any]] = {}

    def _make_key(self, session_key: str) -> str:
        return f"session:{session_key}:window"

    def append(self, session_key: str, frame: Any) -> List[Any]:
        """Append frame to window and return updated window."""
        if _use_redis and _redis_client:
            try:
                key = self._make_key(session_key)
                # Get existing window
                data = _redis_client.get(key)
                window = json.loads(data) if data else []
                # Append new frame
                window.append(frame)
                # Keep only last N frames
                window = window[-self.max_window:]
                # Save back
                _redis_client.setex(key, self.ttl_seconds, json.dumps(window, default=str))
                return window
            except Exception as e:
                logger.error("redis_window_append_failed",
                    session_key=session_key,
                    error=str(e)
                )
                # Fall back to memory
                if session_key not in self._memory_windows:
                    self._memory_windows[session_key] = []
                self._memory_windows[session_key].append(frame)
                self._memory_windows[session_key] = self._memory_windows[session_key][-self.max_window:]
                return self._memory_windows[session_key]
        else:
            if session_key not in self._memory_windows:
                self._memory_windows[session_key] = []
            self._memory_windows[session_key].append(frame)
            self._memory_windows[session_key] = self._memory_windows[session_key][-self.max_window:]
            return self._memory_windows[session_key]

    def get(self, session_key: str) -> List[Any]:
        """Get window for session."""
        if _use_redis and _redis_client:
            try:
                key = self._make_key(session_key)
                data = _redis_client.get(key)
                return json.loads(data) if data else []
            except Exception as e:
                logger.error("redis_window_get_failed",
                    session_key=session_key,
                    error=str(e)
                )
                return self._memory_windows.get(session_key, [])
        else:
            return self._memory_windows.get(session_key, [])

    def clear(self, session_key: str) -> None:
        """Clear window for session."""
        if _use_redis and _redis_client:
            try:
                key = self._make_key(session_key)
                _redis_client.delete(key)
            except Exception as e:
                logger.error("redis_window_clear_failed",
                    session_key=session_key,
                    error=str(e)
                )

        self._memory_windows.pop(session_key, None)


# ── Global instances ────────────────────────────────────────────────────────────
session_store = SessionStore()
session_windows = SessionWindowStore()


# ── Health check helper ─────────────────────────────────────────────────────────
def get_redis_status() -> Dict[str, Any]:
    """Get Redis connection status for health endpoint."""
    return {
        "enabled": _use_redis,
        "connected": _redis_client is not None,
        "url": REDIS_URL if _use_redis else None,
        "active_sessions": session_store.count() if _use_redis else None,
    }
