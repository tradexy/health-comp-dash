import { 
    UserData, 
    HealthDataPoint, 
    AlertLevel, 
    HealthMetricType, 
    BehavioralLog, 
    DietLogType, 
    MoodLogType,
    RiskAssessmentResult,
    METRIC_CONFIG_BACKEND, // Use backend-specific minimal config
    DietLog,
    MoodLog,
    ActivityLog
} from '../types';

// Helper to get recent logs of a specific type
const getRecentLogs = <T extends BehavioralLog>(logs: BehavioralLog[], logType: T['logType'], hours: number): T[] => {
  if (!logs) return [];
  const timeLimit = Date.now() - hours * 60 * 60 * 1000;
  return logs.filter(log => log.logType === logType && log.timestamp >= timeLimit) as T[];
};

export const assessSingleDataPointRiskOnServer = (
  userData: UserData, 
  dataPoint: HealthDataPoint,
  recentBehavioralLogs: BehavioralLog[] = [] 
): RiskAssessmentResult => {
  const thresholds = userData.thresholds;
  const metricConfig = METRIC_CONFIG_BACKEND[dataPoint.type]; // Use backend config

  let level: AlertLevel = AlertLevel.NONE;
  let message = ``;
  let behavioralContextForAlert: BehavioralLog[] = [];

  const recentDietLogs = getRecentLogs<DietLog>(recentBehavioralLogs, 'DIET', 4);
  const recentMoodLogs = getRecentLogs<MoodLog>(recentBehavioralLogs, 'MOOD', 6);

  switch (dataPoint.type) {
    case HealthMetricType.HEART_RATE:
      const hrThreshold = thresholds[HealthMetricType.HEART_RATE];
      if (hrThreshold) {
        let baseMessage = "";
        if (dataPoint.value < hrThreshold.low) {
          level = dataPoint.value < hrThreshold.low - 15 ? AlertLevel.ESCALATION : AlertLevel.MILD;
          baseMessage = `Heart rate is low (${dataPoint.value} ${metricConfig.unit}). Normal: ${hrThreshold.low}-${hrThreshold.high} ${metricConfig.unit}.`;
        } else if (dataPoint.value > hrThreshold.high) {
          level = dataPoint.value > hrThreshold.high + 25 ? AlertLevel.ESCALATION : AlertLevel.MILD;
          baseMessage = `Heart rate is high (${dataPoint.value} ${metricConfig.unit}). Normal: ${hrThreshold.low}-${hrThreshold.high} ${metricConfig.unit}.`;
        }
        message = baseMessage;

        if (level !== AlertLevel.NONE) {
            const stressedMood = recentMoodLogs.find(m => m.moodType === MoodLogType.STRESSED || m.moodType === MoodLogType.ANXIOUS);
            if (stressedMood) {
                message += ` Recent mood: ${stressedMood.moodType}. Stress can affect heart rate.`;
                behavioralContextForAlert.push(stressedMood);
            }
        }
      }
      break;
    case HealthMetricType.GLUCOSE:
      const glucoseThreshold = thresholds[HealthMetricType.GLUCOSE];
      if (glucoseThreshold) {
        let baseMessage = "";
        if (dataPoint.value < glucoseThreshold.low) {
          level = dataPoint.value < glucoseThreshold.low - 20 ? AlertLevel.ESCALATION : AlertLevel.MILD;
          baseMessage = `Glucose is low (${dataPoint.value} ${metricConfig.unit}). Target: ${glucoseThreshold.low}-${glucoseThreshold.high} ${metricConfig.unit}. Potential hypoglycemia.`;
        } else if (dataPoint.value > glucoseThreshold.high) {
          level = dataPoint.value > glucoseThreshold.high + 70 ? AlertLevel.ESCALATION : AlertLevel.MILD; 
          baseMessage = `Glucose is high (${dataPoint.value} ${metricConfig.unit}). Target: ${glucoseThreshold.low}-${glucoseThreshold.high} ${metricConfig.unit}. Potential hyperglycemia.`;
          
          const recentHighCarbMeal = recentDietLogs.find(d => d.dietType === DietLogType.HIGH_CARB || d.dietType === DietLogType.SNACK_HEAVY);
          if (recentHighCarbMeal && level === AlertLevel.MILD) {
             message = baseMessage + ` This may be related to your recent ${recentHighCarbMeal.dietType}. Monitor and follow your plan.`;
             behavioralContextForAlert.push(recentHighCarbMeal);
          } else {
            message = baseMessage;
          }
        }
         if (message === "" && baseMessage !== "") message = baseMessage;
      }
      break;
    case HealthMetricType.SPO2:
      const spo2Threshold = thresholds[HealthMetricType.SPO2];
      if (spo2Threshold && dataPoint.value < spo2Threshold.low) {
        level = dataPoint.value < spo2Threshold.low - 5 ? AlertLevel.ESCALATION : AlertLevel.MILD;
        message = `SpO2 is low (${dataPoint.value}${metricConfig.unit}). Target: >${spo2Threshold.low}${metricConfig.unit}.`;
      }
      break;
    case HealthMetricType.SLEEP_HOURS:
      const sleepThreshold = thresholds[HealthMetricType.SLEEP_HOURS];
      if (sleepThreshold && dataPoint.value < sleepThreshold.low && dataPoint.value > 0) {
        level = AlertLevel.INFO; 
        message = `Recorded sleep (${dataPoint.value} ${metricConfig.unit}) is less than target of ${sleepThreshold.low} ${metricConfig.unit}. Consistent sleep is important.`;
      }
      break;
    case HealthMetricType.ACTIVITY_MINUTES:
      // No direct alert from single data point for activity in this logic.
      break;
    default:
      break;
  }
  
  let finalLevel = level;
  if (level === AlertLevel.ESCALATION && !userData.allowAutoEscalation) {
    finalLevel = AlertLevel.MILD;
    message += " (Escalation automatically downgraded due to user preference. Please monitor closely.)";
  }

  return { 
    level: finalLevel, 
    message,
    metricType: dataPoint.type,
    metricValue: dataPoint.value,
    triggeringData: [dataPoint], // Initially just the data point
    behavioralContext: behavioralContextForAlert, // Context directly related to this assessment
    isInsight: level === AlertLevel.INFO && (dataPoint.type === HealthMetricType.SLEEP_HOURS /* Add other insight conditions here if any */),
    timestamp: dataPoint.timestamp // Use dataPoint's timestamp for the assessment time
  };
};

// generateInsights logic could also be moved to the backend in a future step.
// For now, it remains on the client to keep this change focused.
