async def test_health_returns_ok(client):
    r = await client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"


async def test_health_detailed(client):
    r = await client.get("/health/detailed")
    assert r.status_code == 200
    body = r.json()
    assert "status" in body
    assert "model_loaded" in body


async def test_health_drift(client):
    r = await client.get("/health/drift")
    assert r.status_code == 200
    body = r.json()
    assert "status" in body


async def test_metrics_endpoint(client):
    r = await client.get("/metrics")
    assert r.status_code == 200
    assert "text/plain" in r.headers["content-type"]
