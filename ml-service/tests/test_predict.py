from .conftest import VALID_FRAME


# ── /predict/window ────────────────────────────────────────────────────────────

async def test_predict_window_single_frame(client):
    payload = {"session_key": "test-session-001", "frames": [VALID_FRAME]}
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "risk_score" in body
    assert "risk_level" in body
    assert body["risk_level"] in ("low", "moderate", "high")


async def test_predict_window_multiple_frames(client):
    frames = [dict(VALID_FRAME, frame_index=i) for i in range(5)]
    payload = {"session_key": "test-session-002", "frames": frames}
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert 0 <= body["risk_score"] <= 100


async def test_predict_window_no_session_key(client):
    """session_key is optional — should still succeed."""
    payload = {"frames": [VALID_FRAME]}
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 200


async def test_predict_window_empty_frames_rejected(client):
    payload = {"frames": []}
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 422


async def test_predict_window_missing_frames_rejected(client):
    payload = {"session_key": "test-session-003"}
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 422


# ── /predict/live ──────────────────────────────────────────────────────────────

async def test_predict_live_returns_ok(client):
    payload = {"session_key": "live-session-001", "frame": VALID_FRAME}
    r = await client.post("/predict/live", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "risk_score" in body or "cumulative_risk" in body


async def test_predict_live_accumulates_across_calls(client):
    session = "live-session-accumulate"
    for i in range(3):
        payload = {"session_key": session, "frame": dict(VALID_FRAME, frame_index=i)}
        r = await client.post("/predict/live", json=payload)
        assert r.status_code == 200


async def test_predict_live_missing_session_key_rejected(client):
    payload = {"frame": VALID_FRAME}
    r = await client.post("/predict/live", json=payload)
    assert r.status_code == 422


# ── /report/session/{session_key} ─────────────────────────────────────────────

async def test_get_session_data_unknown_session(client):
    r = await client.get("/report/session/nonexistent-session-xyz")
    assert r.status_code in (200, 404)


async def test_get_session_data_after_live_predict(client):
    session = "live-session-report-test"
    await client.post("/predict/live", json={"session_key": session, "frame": VALID_FRAME})
    r = await client.get(f"/report/session/{session}")
    assert r.status_code == 200
