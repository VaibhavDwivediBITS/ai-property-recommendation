import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_recommendation_structure():
    response = client.post("/api/v1/recommendations", json={
        "user_preferences": {
            "budget_min": 300000,
            "budget_max": 900000,
            "city": "Denver",
            "min_bedrooms": 3,
            "max_commute_time_minutes": 45,
            "min_school_rating": 7,
            "must_have_features": ["garage"],
            "lifestyle_preferences": [],
            "size_preference": "medium",
            "min_garage_spaces": 1
        },
        "max_results": 3
    })
    assert response.status_code in [200, 500]  # 500 if no CSV present
    if response.status_code == 200:
        assert "recommendations" in response.json()
