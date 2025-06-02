import axios from 'axios';
import { HealthMetricType, UserThresholds } from '../types';

const ML_SERVICE_BASE_URL = process.env.ML_SERVICE_BASE_URL || 'http://localhost:8000';

export const fetchPersonalizedThresholds = async (
  userId: string, 
  metric: HealthMetricType
): Promise<{ low: number; high: number } | null> => {
  try {
    const response = await axios.get(
      `${ML_SERVICE_BASE_URL}/ml/personalized_thresholds`,
      { params: { userId, metric } }
    );
    // Assuming the ML service returns { suggestedThresholds: { low: X, high: Y } }
    return response.data.suggestedThresholds;
  } catch (error) {
    console.error(`Error fetching personalized thresholds for ${metric} for user ${userId}:`, error);
    // Return null or a default/fallback threshold in case of error
    return null; 
  }
};
