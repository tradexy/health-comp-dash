import os
import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timedelta
import argparse

# Load environment variables
load_dotenv()

# Connect to MongoDB
client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db = client["healthcompanion"]

def main(metric: str):
    # Set up MLflow
    mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5008"))
    mlflow.set_experiment(f"threshold_{metric}")
    
    # Collect data
    dataset = []
    users = db.users.find({})
    
    for user in users:
        user_id = user["id"]
        
        # Get health data
        cutoff = datetime.now() - timedelta(days=30)
        health_data = list(db.healthdata.find({
            "userId": user_id,
            "type": metric,
            "timestamp": {"$gte": cutoff.timestamp() * 1000}
        }))
        
        if not health_data:
            continue
            
        # Get behavioral logs
        behavioral_logs = list(db.behaviorallogs.find({
            "userId": user_id,
            "timestamp": {"$gte": cutoff.timestamp() * 1000}
        }))
        
        # Get alert feedback
        alerts = list(db.alerts.find({
            "userId": user_id,
            "metricType": metric,
            "userFeedback": {"$exists": True},
            "timestamp": {"$gte": cutoff.timestamp() * 1000}
        }))
        
        # Create features
        values = [d['value'] for d in health_data]
        features = {
            "age": user.get("age", 50),
            "mean": np.mean(values),
            "std": np.std(values),
            "false_alarms": sum(1 for a in alerts if a.get("userFeedback") == "DISMISSED_FALSE_ALARM"),
            "high_carb_meals": sum(1 for log in behavioral_logs 
                                  if log.get("dietType") == "High Carb Meal"),
            "stress_events": sum(1 for log in behavioral_logs 
                                if log.get("moodType") == "Stressed"),
        }
        
        # Use percentiles as targets
        low_target = np.percentile(values, 5)  # 5th percentile
        high_target = np.percentile(values, 95)  # 95th percentile
        
        dataset.append({
            "features": list(features.values()),
            "target": [low_target, high_target]
        })
    
    if not dataset:
        print(f"No data found for metric {metric}. Skipping training.")
        return
    
    # Prepare data
    X = np.array([d["features"] for d in dataset])
    y = np.array([d["target"] for d in dataset])
    
    # Split data with handling for small datasets
    if len(X) > 1:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    else:
        # Use all data for training when we have only one sample
        X_train, y_train = X, y
        X_test, y_test = X, y
    
    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    # Log to MLflow
    with mlflow.start_run() as run:
        run_id = run.info.run_id
        
        mlflow.log_params({
            "model_type": "RandomForestRegressor",
            "n_estimators": 100,
            "metric": metric
        })
        
        # Only evaluate if we have enough samples
        if len(X_test) >= 2:
            y_pred = model.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            mlflow.log_metrics({"mse": mse, "r2": r2})
            print(f"Evaluation metrics: MSE={mse:.4f}, R²={r2:.4f}")
        else:
            print("Skipping evaluation due to insufficient test samples")
            mlflow.log_metric("r2", 0.0)  # Default value
        
        mlflow.sklearn.log_model(model, "model")
        
        # Print and log feature importances
        importances = model.feature_importances_
        feature_names = list(features.keys())
        for name, importance in zip(feature_names, importances):
            mlflow.log_metric(f"feature_{name}_importance", importance)
            print(f"{name}: {importance:.4f}")
    
    # Register model
    model_uri = f"runs:/{run_id}/model"
    try:
        registered_model = mlflow.register_model(model_uri, f"threshold_{metric}")
        print(f"Registered model '{registered_model.name}' version {registered_model.version}")
    except Exception as e:
        print(f"Model registration failed: {e}")
        # Fallback to log model as artifact
        mlflow.log_artifact(local_path="model.pkl", artifact_path="models")
        print("Saved model as artifact instead")

    print(f"Training completed for {metric}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--metric", type=str, required=True)
    args = parser.parse_args()
    main(args.metric)
