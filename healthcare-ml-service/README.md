# Healthcare ML Service

Personalized health alert threshold prediction service.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate    # Windows

---


In terminal
mlflow server --backend-store-uri sqlite:///mlflow.db --default-artifact-root ./artifacts --host 0.0.0.0 --port 5008


In another terminal
# Replace with this special hostname for Docker on Mac
echo "MONGO_URI=mongodb://host.docker.internal:27017" > .env.docker
echo "MLFLOW_TRACKING_URI=http://localhost:5008" >> .env.docker

docker build -t health-ml-service -f docker/Dockerfile .
docker run -p 8000:8000 --env-file .env health-ml-service


In another terminal
curl "http://localhost:8000/ml/personalized_thresholds?userId=user-001&metric=GLUCOSE"