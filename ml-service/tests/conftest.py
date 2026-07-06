import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


VALID_FRAME = {
    "frame_index": 0,
    "eye_contact": 60.0,
    "attention_span": 55.0,
    "emotion_signals": 50.0,
    "gesture_analysis": 45.0,
    "confidence": 80.0,
}
