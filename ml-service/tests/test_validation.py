"""Input validation edge cases — exercises Pydantic field validators."""
import pytest
from .conftest import VALID_FRAME


def _frame(**overrides):
    return {**VALID_FRAME, **overrides}


# ── FrameInput field bounds ────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_eye_contact_above_100_rejected(client):
    payload = {"frames": [_frame(eye_contact=101)]}
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 422


@pytest.mark.anyio
async def test_eye_contact_below_0_rejected(client):
    payload = {"frames": [_frame(eye_contact=-1)]}
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 422


@pytest.mark.anyio
async def test_attention_span_boundary_values_accepted(client):
    for val in (0.0, 50.0, 100.0):
        payload = {"frames": [_frame(attention_span=val)]}
        r = await client.post("/predict/window", json=payload)
        assert r.status_code == 200, f"Failed for attention_span={val}"


# ── WindowRequest validators ───────────────────────────────────────────────────

@pytest.mark.anyio
async def test_whitespace_only_session_key_rejected(client):
    payload = {"session_key": "   ", "frames": [VALID_FRAME]}
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 422


@pytest.mark.anyio
async def test_invalid_email_rejected(client):
    payload = {
        "frames": [VALID_FRAME],
        "parent_email": "not-an-email",
    }
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 422


@pytest.mark.anyio
async def test_valid_email_accepted(client):
    payload = {
        "frames": [VALID_FRAME],
        "parent_email": "parent@example.com",
    }
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 200


@pytest.mark.anyio
async def test_invalid_phone_rejected(client):
    payload = {
        "frames": [VALID_FRAME],
        "parent_phone": "abc-def-ghij",
    }
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 422


@pytest.mark.anyio
async def test_valid_phone_accepted(client):
    payload = {
        "frames": [VALID_FRAME],
        "parent_phone": "+91 98765 43210",
    }
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 200


# ── base64 image validation ────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_invalid_base64_image_rejected(client):
    frame = _frame(image_base64="not!!valid==base64!!!")
    payload = {"frames": [frame]}
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 422


@pytest.mark.anyio
async def test_none_image_accepted(client):
    frame = _frame(image_base64=None)
    payload = {"frames": [frame]}
    r = await client.post("/predict/window", json=payload)
    assert r.status_code == 200


# ── LiveRequest validators ─────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_live_whitespace_session_key_rejected(client):
    payload = {"session_key": "\t\n", "frame": VALID_FRAME}
    r = await client.post("/predict/live", json=payload)
    assert r.status_code == 422
