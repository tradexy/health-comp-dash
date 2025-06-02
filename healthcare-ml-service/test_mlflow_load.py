import mlflow
import os
from dotenv import load_dotenv

load_dotenv() # Load .env for MLFLOW_TRACKING_URI

tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5008")
print(f"Attempting to load model from MLflow tracking URI: {tracking_uri}")
mlflow.set_tracking_uri(tracking_uri)

model_name = "threshold_GLUCOSE"
model_uri = f"models:/{model_name}/latest"

try:
    print(f"Attempting to load model: {model_uri}")
    model = mlflow.pyfunc.load_model(model_uri)
    print(f"Successfully loaded model: {model_name}")
    print(f"Model metadata: {model._model_meta}")
except Exception as e:
    print(f"Failed to load model {model_name} from {model_uri}: {str(e)}")
    import traceback
    traceback.print_exc()
