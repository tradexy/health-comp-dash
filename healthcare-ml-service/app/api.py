from fastapi import FastAPI
from .model_predictor import ModelPredictor

app = FastAPI()
predictor = ModelPredictor()

@app.get("/ml/personalized_thresholds")
async def get_thresholds(userId: str, metric: str):
    suggestion = predictor.predict(userId, metric)
    return {
        "userId": userId,
        "metric": metric,
        "suggestedThresholds": suggestion.suggestedThresholds,
        "modelVersion": suggestion.modelVersion,
        "suggestionTimestamp": suggestion.suggestionTimestamp,
        "confidence": suggestion.confidence
    }