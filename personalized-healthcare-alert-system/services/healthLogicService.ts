
import { UserData, HealthDataPoint, AlertLevel, HealthMetricType, Alert, UserThresholds, BehavioralLog, DietLogType, MoodLogType, Insight } from '../types';
// METRIC_CONFIG is used by generateInsights, so it stays.
// assessSingleDataPointRisk has been moved to the backend.

// Helper to get recent logs of a specific type (still used by generateInsights)
const getRecentLogs = <T extends BehavioralLog>(logs: BehavioralLog[], logType: T['logType'], hours: number): T[] => {
  const timeLimit = Date.now() - hours * 60 * 60 * 1000;
  return logs.filter(log => log.logType === logType && log.timestamp >= timeLimit) as T[];
};

// RiskAssessmentResult is now primarily a backend type, but Insight type is similar
// and used for client-side generation of insights.
interface ClientInsightResult {
  level: AlertLevel.INFO; // Insights are always INFO level
  message: string;
  triggeringData?: (HealthDataPoint | BehavioralLog)[];
  isInsight: true;
  timestamp: number;
}


export const generateInsights = (userData: UserData, healthDataStream: HealthDataPoint[], behavioralLogs: BehavioralLog[]): ClientInsightResult[] => {
    const insights: ClientInsightResult[] = [];
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

    // Insight: Consistently low sleep
    const sleepData = healthDataStream.filter(dp => dp.type === HealthMetricType.SLEEP_HOURS && dp.timestamp > threeDaysAgo && dp.value > 0);
    const sleepThreshold = userData.thresholds[HealthMetricType.SLEEP_HOURS];
    if (sleepData.length >= 3 && sleepThreshold) {
        const averageSleep = sleepData.reduce((sum, dp) => sum + dp.value, 0) / sleepData.length;
        if (averageSleep < sleepThreshold.low) {
            insights.push({
                level: AlertLevel.INFO,
                message: `Insight: Average sleep over the last ${sleepData.length} nights (${averageSleep.toFixed(1)} hrs) is below your target of ${sleepThreshold.low} hrs. Consider reviewing sleep habits.`,
                triggeringData: sleepData.slice(0,3),
                isInsight: true,
                timestamp: Date.now()
            });
        }
    }
    
    // Insight: Glucose often near high threshold
    const glucoseData = healthDataStream.filter(dp => dp.type === HealthMetricType.GLUCOSE && dp.timestamp > threeDaysAgo);
    const glucoseThreshold = userData.thresholds[HealthMetricType.GLUCOSE];
    if (glucoseData.length > 5 && glucoseThreshold) {
        const highGlucoseReadings = glucoseData.filter(dp => dp.value > glucoseThreshold.high * 0.9 && dp.value <= glucoseThreshold.high * 1.1); 
        if (highGlucoseReadings.length / glucoseData.length > 0.5) { 
             insights.push({
                level: AlertLevel.INFO,
                message: `Insight: Glucose readings have frequently been near the upper end of your target range (${glucoseThreshold.low}-${glucoseThreshold.high} mg/dL) recently. Review diet logs or discuss with your provider.`,
                triggeringData: highGlucoseReadings.slice(0,3),
                isInsight: true,
                timestamp: Date.now()
            });
        }
    }

    // Insight: Activity levels low for a few days
    const activityData = healthDataStream.filter(dp => dp.type === HealthMetricType.ACTIVITY_MINUTES && dp.timestamp > threeDaysAgo);
    const activityThreshold = userData.thresholds[HealthMetricType.ACTIVITY_MINUTES];
     if (activityData.length >= 3 && activityThreshold) {
        const daysBelowTarget = activityData.filter(dp => dp.value < activityThreshold.low).length;
        if (daysBelowTarget >=2) {
             insights.push({
                level: AlertLevel.INFO,
                message: `Insight: Recorded activity has been below your target of ${activityThreshold.low} mins on ${daysBelowTarget} of the last ${activityData.length} days. Regular activity is beneficial.`,
                triggeringData: activityData.filter(dp => dp.value < activityThreshold.low).slice(0,2),
                isInsight: true,
                timestamp: Date.now()
            });
        }
    }
    return insights;
};


// assessOverallRisk is also kept on client for now, if it's used for combining insights or simple client-side checks.
// It might be a candidate for backend migration later if it becomes more complex or needs more server data.
// For now, let's assume its current client-side implementation is sufficient.
// The 'RiskAssessmentResult' here would be for client-side combination, not the one from backend's single point assessment.
interface ClientOverallRiskResult {
  level: AlertLevel;
  message: string;
  triggeringData?: (HealthDataPoint | BehavioralLog)[];
  behavioralContext?: BehavioralLog[];
  timestamp: number;
}
export const assessOverallRisk = (
    userData: UserData, 
    recentData: HealthDataPoint[], 
    behavioralLogs: BehavioralLog[]
): ClientOverallRiskResult[] => {
  const alerts: ClientOverallRiskResult[] = [];
  
  // This function's logic might need to be re-evaluated in context of backend assessments.
  // For now, let's keep its structure but acknowledge that primary risk assessment for NEW data points
  // happens on the backend. This function might be used for secondary checks or complex client-side aggregations.
  // A simplified version or removal might be better. Let's comment out the complex rule as it's less relevant now.

  const latestDataByType: Partial<Record<HealthMetricType, HealthDataPoint>> = {};
  for (const dp of recentData) {
    if (!latestDataByType[dp.type] || dp.timestamp > latestDataByType[dp.type]!.timestamp) {
      latestDataByType[dp.type] = dp;
    }
  }
  
  /*
  // Example of a more complex rule (e.g., high glucose + low SpO2) - this is highly simplified
  // This kind of complex rule might be better suited for backend processing in the long run.
  const latestGlucose = latestDataByType[HealthMetricType.GLUCOSE];
  const latestSpo2 = latestDataByType[HealthMetricType.SPO2];
  const glucoseThreshold = userData.thresholds[HealthMetricType.GLUCOSE];
  const spo2Threshold = userData.thresholds[HealthMetricType.SPO2];

  if (latestGlucose && glucoseThreshold && latestGlucose.value > glucoseThreshold.high + 50 && 
      latestSpo2 && spo2Threshold && latestSpo2.value < spo2Threshold.low - 2) { 
    
    let combinedLevel = AlertLevel.ESCALATION;
    let combinedMessage = `Client-side Check: High glucose (${latestGlucose.value} mg/dL) and low SpO2 (${latestSpo2.value}%) detected.`;
    if (!userData.allowAutoEscalation) {
        combinedLevel = AlertLevel.MILD;
        combinedMessage += " (Escalation downgraded by preference.)";
    }
    
    alerts.push({
      level: combinedLevel,
      message: combinedMessage,
      triggeringData: [latestGlucose, latestSpo2],
      behavioralContext: getRecentLogs(behavioralLogs, 'MOOD', 6).concat(getRecentLogs(behavioralLogs, 'DIET', 4)),
      timestamp: Date.now()
    });
  }
  */
  
  alerts.sort((a, b) => {
    const order = { [AlertLevel.ESCALATION]: 0, [AlertLevel.MILD]: 1, [AlertLevel.INFO]: 2, [AlertLevel.NONE]: 3 };
    return order[a.level] - order[b.level];
  });

  return alerts;
};
