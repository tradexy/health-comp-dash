
export enum HealthMetricType {
  HEART_RATE = 'HEART_RATE',
  GLUCOSE = 'GLUCOSE',
  SPO2 = 'SPO2',
  SLEEP_HOURS = 'SLEEP_HOURS',
  ACTIVITY_MINUTES = 'ACTIVITY_MINUTES',
}

export interface HealthDataPoint {
  id: string;
  timestamp: number;
  type: HealthMetricType;
  value: number;
  unit: string;
}

export interface EHRData {
  medications: string[];
  allergies: string[];
  diagnoses: string[];
}

export enum DietLogType {
  LOW_CARB = "Low Carb Meal",
  BALANCED = "Balanced Meal",
  HIGH_CARB = "High Carb Meal",
  SNACK_LIGHT = "Light Snack",
  SNACK_HEAVY = "Heavy Snack",
  FASTING = "Fasting",
}

export enum MoodLogType {
  HAPPY = "Happy",
  CALM = "Calm",
  STRESSED = "Stressed",
  ANXIOUS = "Anxious",
  SAD = "Sad",
  ENERGETIC = "Energetic",
}

interface BaseBehavioralLog {
  id: string;
  timestamp: number;
  notes?: string;
}

export interface DietLog extends BaseBehavioralLog {
  logType: 'DIET';
  dietType: DietLogType;
  details?: string; // e.g., specific foods
}

export interface MoodLog extends BaseBehavioralLog {
  logType: 'MOOD';
  moodType: MoodLogType;
}

export interface ActivityLog extends BaseBehavioralLog {
  logType: 'ACTIVITY';
  activityType: string; // e.g., "Running", "Walking"
  durationMinutes: number;
  intensity?: 'LOW' | 'MEDIUM' | 'HIGH';
}


export type BehavioralLog = DietLog | MoodLog | ActivityLog;


export interface UserThresholds {
  [HealthMetricType.HEART_RATE]?: { low: number; high: number };
  [HealthMetricType.GLUCOSE]?: { low: number; high: number };
  [HealthMetricType.SPO2]?: { low: number; high: number }; // Typically only a low threshold
  [HealthMetricType.SLEEP_HOURS]?: { low: number }; // Minimum desired sleep
  [HealthMetricType.ACTIVITY_MINUTES]?: { low: number }; // Minimum daily activity
}

export interface UserData {
  id: string;
  name: string;
  age: number;
  ehr: EHRData;
  thresholds: UserThresholds;
  allowAutoEscalation: boolean;
}

export enum AlertLevel {
  INFO = 'INFO', // General information or insights
  MILD = 'MILD',
  ESCALATION = 'ESCALATION',
  NONE = 'NONE',
}

export interface Alert {
  id: string;
  timestamp: number;
  userId: string;
  level: AlertLevel;
  metricType?: HealthMetricType; // Metric directly causing alert
  metricValue?: number;
  message: string;
  dataTriggering?: HealthDataPoint[]; // Health data points involved
  behavioralContext?: BehavioralLog[]; // Relevant behavioral logs
  explanationRequested?: boolean;
  explanation?: string;
  originalLevel?: AlertLevel;
  isInsight?: boolean; // Differentiates insights from direct health alerts
  userFeedback?: 'DISMISSED_ACKNOWLEDGED' | 'DISMISSED_EXPECTED' | 'DISMISSED_FALSE_ALARM';
  isDismissed?: boolean;
}

// Renamed from Alert to HealthAlert for clarity if needed, but Alert is fine for now.
// We can add a new type for Insights if they diverge significantly in structure.
export interface Insight {
    id: string;
    timestamp: number;
    userId: string;
    message: string;
    relatedData?: (HealthDataPoint | BehavioralLog)[];
    // Actionable suggestions?
}

// This type is received from the backend when posting health data.
export interface RiskAssessmentResult {
  level: AlertLevel;
  message: string;
  metricType?: HealthMetricType;
  metricValue?: number;
  triggeringData?: (HealthDataPoint | BehavioralLog)[];
  behavioralContext?: BehavioralLog[];
  isInsight?: boolean;
  timestamp: number;
}
