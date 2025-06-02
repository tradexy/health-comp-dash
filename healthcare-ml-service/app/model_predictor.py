import mlflow
import numpy as np
from .schemas import ThresholdSuggestion
from datetime import datetime
import os
from dotenv import load_dotenv
from .data_loader import MongoDBLoader
import logging
import traceback # NEW IMPORT

# Set up logging
logger = logging.getLogger(__name__)

load_dotenv()

class ModelPredictor:
    def __init__(self):
        self.models = {}
        self.metric_models = {
            "GLUCOSE": "threshold_glucose",
            "HEART_RATE": "threshold_heart_rate"
        }
        self.data_loader = MongoDBLoader()
        
        # Set MLflow tracking URI
        tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5008")
        logger.info(f"Using MLflow tracking URI: {tracking_uri}")
        mlflow.set_tracking_uri(tracking_uri)
       
        # Test connection
        try:
            mlflow.search_experiments()
            logger.info("MLflow connection successful")
        except Exception as e:
            logger.error(f"MLflow connection failed: {str(e)}")
    
    def load_model(self, metric: str):
        if metric not in self.models:
            model_name = self.metric_models.get(metric)
            if not model_name:
                logger.error(f"Unsupported metric: {metric}")
                raise ValueError(f"Unsupported metric: {metric}")
                
            # Load model directly from mounted artifact path for debugging
            if metric == "GLUCOSE":
                # Use the run ID from the latest GLUCOSE training run
                run_id = "3cae630e765c4fd8ae8e89a9f368de90" 
            elif metric == "HEART_RATE":
                # Use the run ID from the latest HEART_RATE training run
                run_id = "aa610fb7d9b54147ba63bb3c03ddc1af"
            else:
                logger.error(f"Unsupported metric for direct load: {metric}")
                raise ValueError(f"Unsupported metric for direct load: {metric}")

            # Construct the file URI to the mounted artifacts
            # The artifacts are mounted at /mlflow_artifacts in the container
            model_uri = f"file:///mlflow_artifacts/1/{run_id}/artifacts/model" 
            logger.info(f"Attempting to load model from FILE URI: {model_uri}")
            try:
                self.models[metric] = mlflow.pyfunc.load_model(model_uri)
                logger.info(f"Successfully loaded model: {model_name} from file URI {model_uri}")
            except Exception as e:
                logger.error(f"Failed to load model {model_name} from {model_uri} (File URI): {str(e)}")
                traceback.print_exc()
                raise # Re-raise to be caught by predict's outer try-except
        return self.models[metric]
    
    def predict(self, user_id: str, metric: str) -> ThresholdSuggestion:
        try:
            logger.info(f"Entering predict method for user: {user_id}, metric: {metric}")
            
            # Fetch user data
            user_data = self.data_loader.get_user_data(user_id)
            if not user_data:
                logger.error(f"No user found with ID: {user_id}")
                raise ValueError(f"No user found with ID: {user_id}")
            logger.info(f"Fetched user data for {user_id}")
                
            health_data = self.data_loader.get_health_data(user_id, metric)
            behavioral_logs = self.data_loader.get_behavioral_logs(user_id)
            alerts = self.data_loader.get_alert_feedback(user_id, metric)
            logger.info(f"Fetched health data, behavioral logs, and alerts for {user_id}")
            
            # Create features
            values = [d['value'] for d in health_data]
            features = {
                "age": user_data.get("age", 50),
                "mean": np.mean(values) if values else 0,
                "std": np.std(values) if len(values) > 1 else 0,
                "false_alarms": sum(1 for a in alerts if a.get("userFeedback") == "DISMISSED_FALSE_ALARM"),
                "high_carb_meals": sum(1 for log in behavioral_logs if log.get("dietType") == "High Carb Meal"),
                "stress_events": sum(1 for log in behavioral_logs if log.get("moodType") == "Stressed"),
            }
            logger.info(f"Created features: {features}")
            
            model = self.load_model(metric)
            logger.info(f"Model loaded for {metric}")
            
            # Convert features to model input format
            input_data = [[
                features["mean"],
                features["std"],
                features["false_alarms"],
                features["high_carb_meals"],
                features["stress_events"],
                features["age"]
            ]]
            logger.info(f"Input data for prediction: {input_data}")
            
            # Predict and format results
            prediction = model.predict(input_data)[0]
            low, high = prediction[0], prediction[1]
            logger.info(f"Prediction raw result: {prediction}")
            
            # Get model version
            model_version = self.models[metric]._model_meta.run_id
            logger.info(f"Model version: {model_version}")
            
            # Calculate confidence with proper parentheses
            if features["mean"]:
                confidence = min(0.95, max(0.7, 1 - (features["std"] / features["mean"])))
            else:
                confidence = 0.8
            logger.info(f"Confidence: {confidence}")
            
            return ThresholdSuggestion(
                suggestedThresholds={"low": low, "high": high},
                modelVersion=model_version,
                suggestionTimestamp=datetime.utcnow().isoformat() + "Z",
                confidence=confidence
            )
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            traceback.print_exc() # NEW LINE
            # Return fallback values
            return ThresholdSuggestion(
                suggestedThresholds={"low": 70, "high": 180},
                modelVersion="fallback_v1",
                suggestionTimestamp=datetime.utcnow().isoformat() + "Z",
                confidence=0.8
            )
