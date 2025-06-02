#!/bin/bash

# Set MLflow tracking URI
export MLFLOW_TRACKING_URI=http://localhost:5000

# Create experiments
mlflow experiments create --experiment-name threshold_glucose
mlflow experiments create --experiment-name threshold_heart_rate

echo "MLflow setup complete. Tracking URI: $MLFLOW_TRACKING_URI"