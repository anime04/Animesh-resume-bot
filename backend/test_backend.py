import json
from app.resume_service import resume_service
from app.rate_limit import InMemoryRateLimiter
from app.groq_client import GroqClient
from fastapi.testclient import TestClient
from app.main import app

def test_resume_service():
    assert resume_service.resume_data["name"] == "Animesh Jain"
    assert "Orky.io" in resume_service.system_prompt
    assert "RESUME DATA:" in resume_service.system_prompt
    
    # Test keyword tagging
    sources = resume_service.get_sources("Tell me about your RAG pipeline experience at Orky", "I designed the ingestion and chunking pipeline")
    assert "orky" in sources or "experience" in sources
    print("[PASS] test_resume_service")

def test_rate_limiter():
    limiter = InMemoryRateLimiter(requests_per_minute=3)
    ip = "192.168.1.10"
    assert limiter.is_allowed(ip) is True
    assert limiter.is_allowed(ip) is True
    assert limiter.is_allowed(ip) is True
    assert limiter.is_allowed(ip) is False
    print("[PASS] test_rate_limiter")

def test_groq_client_fail_fast():
    try:
        GroqClient(api_key="")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "GROQ_API_KEY is not set" in str(e)
    print("[PASS] test_groq_client_fail_fast")

def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    print("[PASS] test_health_endpoint")

def test_chat_endpoint_validation():
    client = TestClient(app)
    # Empty messages
    response = client.post("/api/chat", json={"messages": []})
    assert response.status_code == 400
    assert response.json()["error"] == "invalid_request"
    
    # Missing messages
    response = client.post("/api/chat", json={})
    assert response.status_code == 400
    assert response.json()["error"] == "invalid_request"
    print("[PASS] test_chat_endpoint_validation")

if __name__ == "__main__":
    test_resume_service()
    test_rate_limiter()
    test_groq_client_fail_fast()
    test_health_endpoint()
    test_chat_endpoint_validation()
    print("All backend tests passed successfully!")
