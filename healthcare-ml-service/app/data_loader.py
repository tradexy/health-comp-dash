import os
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timedelta
import logging

# Set up logging
logger = logging.getLogger(__name__)

load_dotenv()

class MongoDBLoader:
    def __init__(self):
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        logger.info(f"Connecting to MongoDB at: {mongo_uri}")
        self.client = MongoClient(mongo_uri)
        self.db = self.client["healthcompanion"]
        logger.info(f"Connected to database: healthcompanion")
    
    def get_user_data(self, user_id: str):
        return self.db.users.find_one({"id": user_id})
    
    def get_health_data(self, user_id: str, metric: str, days=30):
        cutoff = datetime.now() - timedelta(days=days)
        return list(self.db.healthdata.find({
            "userId": user_id,
            "type": metric,
            "timestamp": {"$gte": cutoff.timestamp() * 1000}
        }))
    
    def get_behavioral_logs(self, user_id: str, days=30):
        cutoff = datetime.now() - timedelta(days=days)
        return list(self.db.behaviorallogs.find({
            "userId": user_id,
            "timestamp": {"$gte": cutoff.timestamp() * 1000}
        }))
    
    def get_alert_feedback(self, user_id: str, metric: str, days=90):
        cutoff = datetime.now() - timedelta(days=days)
        return list(self.db.alerts.find({
            "userId": user_id,
            "metricType": metric,
            "userFeedback": {"$exists": True},
            "timestamp": {"$gte": cutoff.timestamp() * 1000}
        }))