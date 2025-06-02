# feature_engineer.py
def create_features(user_data, health_data, behavioral_logs, alerts):
    # Health metrics features
    health_features = {
        "glucose_mean": np.mean([d.value for d in health_data if d.type == "GLUCOSE"]),
        "hr_std_dev": np.std([d.value for d in health_data if d.type == "HEART_RATE"]),
        # Additional statistical features
    }
    
    # Behavioral features
    behavioral_features = {
        "high_carb_meals": sum(1 for log in behavioral_logs 
                              if log.logType == "DIET" and log.dietType == "High Carb Meal"),
        "stress_events": sum(1 for log in behavioral_logs 
                            if log.logType == "MOOD" and log.moodType == "Stressed"),
        # Additional behavioral metrics
    }
    
    # Alert feedback features
    alert_features = {
        "false_alarms": sum(1 for alert in alerts 
                          if alert.userFeedback == "DISMISSED_FALSE_ALARM"),
        "acknowledged_alerts": sum(1 for alert in alerts 
                                  if alert.userFeedback == "DISMISSED_ACKNOWLEDGED"),
        # Additional alert metrics
    }
    
    return {**health_features, **behavioral_features, **alert_features}