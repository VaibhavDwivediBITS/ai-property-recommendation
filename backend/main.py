
# main.py - FastAPI backend using ML model from .pkl
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import joblib
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global data store
property_data: pd.DataFrame = None
model_bundle: Dict[str, Any] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    global property_data, model_bundle

    try:
        property_data = pd.read_csv('enhanced_property_data_with_rich_descriptions.csv')
        logger.info(f"Loaded {len(property_data)} properties.")
    except Exception as e:
        logger.error(f"Failed to load CSV: {e}")
        property_data = pd.DataFrame()

    try:
        model_bundle = joblib.load("enhanced_price_model.pkl")
        logger.info("ML model and scaler loaded.")
    except Exception as e:
        logger.error(f"Failed to load .pkl model: {e}")

    yield
    logger.info("Shutting down.")

app = FastAPI(title="AI Property Recommendation", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------ MODELS ------------------------ #
class UserPreferences(BaseModel):
    budget_min: int = 200000
    budget_max: int = 1000000
    city: Optional[str] = None
    min_bedrooms: int = 1
    max_commute_time_minutes: int = 60
    min_school_rating: int = 1
    must_have_features: List[str] = []
    lifestyle_preferences: List[str] = []
    size_preference: str = "any"
    min_garage_spaces: int = 0

class RecommendationRequest(BaseModel):
    user_preferences: UserPreferences
    max_results: int = 3

class PropertyRecommendation(BaseModel):
    property_id: str
    address: str
    price: int
    score: float
    reason: str

class RecommendationResponse(BaseModel):
    recommendations: List[PropertyRecommendation]

# ---------------------- ROUTE ---------------------- #
@app.post("/api/v1/recommendations", response_model=RecommendationResponse)
def recommend_properties(req: RecommendationRequest):
    global property_data, model_bundle
    prefs = req.user_preferences

    if property_data.empty:
        raise HTTPException(status_code=500, detail="No property data available")

    # Filter data
    df = property_data.copy()
    df = df[(df['price'] >= prefs.budget_min) & (df['price'] <= prefs.budget_max)]
    df = df[df['bedrooms'] >= prefs.min_bedrooms]
    df = df[df['commute_time_min'] <= prefs.max_commute_time_minutes]
    df = df[df['school_rating'] >= prefs.min_school_rating]
    if prefs.city:
        df = df[df['city'] == prefs.city]
    if 'pool' in prefs.must_have_features:
        df = df[df['has_pool'] == True]
    df = df[df['garage_spaces'] >= prefs.min_garage_spaces]

    if df.empty:
        return RecommendationResponse(recommendations=[])

    # Model Prediction
    model = model_bundle['model']
    scaler = model_bundle['scaler']
    features = model_bundle['features']
    X = scaler.transform(df[features])
    preds = model.predict_proba(X)[:, 1] if hasattr(model, 'predict_proba') else model.predict(X)

    df['score'] = preds
    df_sorted = df.sort_values(by='score', ascending=False).head(req.max_results)

    recommendations = []
    for _, row in df_sorted.iterrows():
        reason = f"Located in {row['city']}, {row['bedrooms']} BR, ${row['price']} - School rating: {row['school_rating']}"
        recommendations.append(PropertyRecommendation(
            property_id=str(row['property_id']),
            address=row['address'],
            price=row['price'],
            score=round(row['score'] * 100, 2),
            reason=reason
        ))

    return RecommendationResponse(recommendations=recommendations)

@app.get("/health")
def health():
    return {"status": "ok"}
