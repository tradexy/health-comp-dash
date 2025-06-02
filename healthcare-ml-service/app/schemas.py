from pydantic import BaseModel
from typing import Dict, Optional

class Thresholds(BaseModel):
    low: float
    high: float

class ThresholdSuggestion(BaseModel):
    suggestedThresholds: Thresholds
    modelVersion: str
    suggestionTimestamp: str
    confidence: Optional[float] = None