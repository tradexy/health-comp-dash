import os
import random
import time
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB
client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db = client["healthcompanion"]

# Number of synthetic users to create
NUM_USERS = 5

# How many days of data to generate per user
DAYS = 30

# Base timestamp: now
now = datetime.now()

# Function to generate health data for a day for a given user
def generate_health_data_for_day(user_id, day_offset):
    base_timestamp = now - timedelta(days=day_offset)
    data = []
    
    # Glucose (4-8 readings per day)
    for _ in range(random.randint(4, 8)):
        timestamp = base_timestamp + timedelta(hours=random.randint(0,23), minutes=random.randint(0,59))
        data.append({
            "userId": user_id,
            "timestamp": int(timestamp.timestamp() * 1000),
            "type": "GLUCOSE",
            "value": random.randint(70, 200),
            "unit": "mg/dL"
        })
    
    # Heart rate (continuous monitoring - 24 readings)
    for hour in range(0, 24):
        timestamp = base_timestamp + timedelta(hours=hour)
        data.append({
            "userId": user_id,
            "timestamp": int(timestamp.timestamp() * 1000),
            "type": "HEART_RATE",
            "value": random.randint(60, 100),
            "unit": "bpm"
        })
    
    return data

# Function to generate behavioral logs for a day for a given user
def generate_behavioral_logs_for_day(user_id, day_offset):
    base_timestamp = now - timedelta(days=day_offset)
    logs = []
    
    # Mood log
    logs.append({
        "userId": user_id,
        "timestamp": int((base_timestamp + timedelta(hours=18)).timestamp() * 1000),
        "logType": "MOOD",
        "moodType": random.choice(["Happy", "Normal", "Stressed", "Tired"])
    })
    
    # Diet logs (2-4 per day)
    for meal in ["Breakfast", "Lunch", "Dinner", "Snack"]:
        if random.random() > 0.3:  # 70% chance to log each meal type
            logs.append({
                "userId": user_id,
                "timestamp": int((base_timestamp + timedelta(hours=random.randint(7,20))).timestamp() * 1000),
                "logType": "DIET",
                "dietType": meal
            })
    
    return logs

# Generate and insert data for each user
for user_num in range(1, NUM_USERS + 1):
    user_id = f"user-{user_num:03d}"
    
    all_health_data = []
    all_behavioral_logs = []
    
    for day in range(DAYS):
        all_health_data.extend(generate_health_data_for_day(user_id, day))
        all_behavioral_logs.extend(generate_behavioral_logs_for_day(user_id, day))
    
    # Insert into MongoDB
    if all_health_data:
        db.healthdata.insert_many(all_health_data)
    if all_behavioral_logs:
        db.behaviorallogs.insert_many(all_behavioral_logs)
    
    print(f"Inserted for {user_id}: {len(all_health_data)} health records and {len(all_behavioral_logs)} behavioral logs")
