#!/bin/bash
# infrastructure/deploy_azure.sh

RESOURCE_GROUP="hca-ml-rg"
LOCATION="eastus"
WORKSPACE_NAME="hca-ml-workspace"

# Create Azure resources
az group create --name $RESOURCE_GROUP --location $LOCATION
az ml workspace create -n $WORKSPACE_NAME -g $RESOURCE_GROUP

# Configure MLflow tracking
MLFLOW_TRACKING_URI=$(az ml workspace show -n $WORKSPACE_NAME -g $RESOURCE_GROUP --query mlFlowTrackingUri -o tsv)
echo "export MLFLOW_TRACKING_URI=$MLFLOW_TRACKING_URI" >> .env

# Build and deploy container
az acr build --image health-ml-service --registry $ACR_NAME --file docker/Dockerfile .
az container create --name ml-service --image $ACR_NAME.azurecr.io/health-ml-service --ports 8000