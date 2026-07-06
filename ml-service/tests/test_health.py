async def test_health_returns_ok(client):
    r = await client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert "service" in body


async def test_health_detailed(client):
    r = await client.get("/health/detailed")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert "model_ready" in body


async def test_health_drift(client):
    r = await client.get("/health/drift")
    assert r.status_code == 200
    body = r.json()
    assert "status" in body or "ok" in body or "drift_detected" in body


async def test_metrics_endpoint(client):
    r = await client.get("/metrics")
    assert r.status_code == 200
    assert "text/plain" in r.headers["content-type"]
