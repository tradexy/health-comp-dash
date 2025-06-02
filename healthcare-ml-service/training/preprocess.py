import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

def preprocess_data(health_data, behavioral_logs, alert_feedback, user_age):
    # Health metrics features
    values = [d['value'] for d in health_data]
    health_features = {
        "mean": np.mean(values) if values else 0,
        "std": np.std(values) if len(values) > 1 else 0,
        "count": len(values)
    }
    
    # Behavioral features
    diet_count = sum(1 for log in behavioral_logs if log.get('logType') == 'DIET')
    high_carb_meals = sum(1 for log in behavioral_logs 
                         if log.get('dietType') == 'High Carb Meal')
    stress_events = sum(1 for log in behavioral_logs 
                       if log.get('moodType') == 'Stressed')
    
    # Alert feedback features
    false_alarms = sum(1 for alert in alert_feedback 
                      if alert.get('userFeedback') == 'DISMISSED_FALSE_ALARM')
    
    return {
        "age": user_age,
        "mean": health_features["mean"],
        "std": health_features["std"],
        "false_alarms": false_alarms,
        "high_carb_meals": high_carb_meals,
        "stress_events": stress_events,
        "diet_count": diet_count
    }