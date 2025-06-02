// For now, these types will mirror the frontend types.ts
// In a larger application, they might diverge or be partially shared.
import { ObjectId } from 'mongodb';

export enum HealthMetricType {
  HEART_RATE = 'HEART_RATE',
  GLUCOSE = 'GLUCOSE',
  SPO2 = 'SPO2',
  SLEEP_HOURS = 'SLEEP_HOURS',
  ACTIVITY_MINUTES = 'ACTIVITY_MINUTES',
}

export interface HealthDataPoint {
  _id?: ObjectId; // MongoDB ID
  id: string; // Original client-side ID, can be kept for reference or used as primary if unique
  userId: string; // Added to associate data with a user
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
  _id?: ObjectId; // MongoDB ID
  id: string; // Original client-side ID
  userId: string; // Added to associate data with a user
  timestamp: number;
  notes?: string;
}

export interface DietLog extends BaseBehavioralLog {
  logType: 'DIET';
  dietType: DietLogType;
  details?: string; 
}

export interface MoodLog extends BaseBehavioralLog {
  logType: 'MOOD';
  moodType: MoodLogType;
}

export interface ActivityLog extends BaseBehavioralLog {
  logType: 'ACTIVITY';
  activityType: string; 
  durationMinutes: number;
  intensity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type BehavioralLog = DietLog | MoodLog | ActivityLog;

export interface UserThresholds {
  [HealthMetricType.HEART_RATE]?: { low: number; high: number };
  [HealthMetricType.GLUCOSE]?: { low: number; high: number };
  [HealthMetricType.SPO2]?: { low: number; high: number };
  [HealthMetricType.SLEEP_HOURS]?: { low: number };
  [HealthMetricType.ACTIVITY_MINUTES]?: { low: number };
}

export interface UserData {
  _id?: ObjectId; // MongoDB ID for the user document itself
  id: string; // This 'id' will be the primary key we use for users (e.g., 'user-001')
  name: string;
  age: number;
  ehr: EHRData;
  thresholds: UserThresholds;
  allowAutoEscalation: boolean;
  lastThresholdAdjustment?: number; // NEW: Timestamp of last ML-based threshold adjustment
}

// Type for storing user data on the server, keyed by user ID (no longer needed if using MongoDB collections correctly)
// export interface ServerUsersData {
//   [userId: string]: UserData;
// }


export enum AlertLevel {
  INFO = 'INFO',
  MILD = 'MILD',
  ESCALATION = 'ESCALATION',
  NONE = 'NONE',
}

// This is the structure of the risk assessment result from healthLogicService
export interface RiskAssessmentResult {
  level: AlertLevel;
  message: string;
  metricType?: HealthMetricType;
  metricValue?: number;
  triggeringData?: (HealthDataPoint | BehavioralLog)[]; // Can be a mix
  behavioralContext?: BehavioralLog[];
  isInsight?: boolean;
  timestamp: number; 
}

// Structure for requests to the backend
export interface AddHealthDataRequest {
  dataPoint: Omit<HealthDataPoint, '_id' | 'userId'>; // Backend will add userId
  userData: UserData; // Send current user context
  recentBehavioralLogs: Omit<BehavioralLog, '_id' | 'userId'>[]; // Backend will add userId
}

export interface ExplainAlertRequest {
  alert: Alert; // Frontend Alert type
  userData: UserData;
  recentBehavioralLogs?: Omit<BehavioralLog, '_id' | 'userId'>[];
}

// Alert type from frontend - might be slightly different if we store alerts on backend later
// For now, backend doesn't directly store this full Alert structure, it produces RiskAssessmentResult
export interface Alert {
  id: string; // Client-side generated ID
  timestamp: number;
  userId: string;
  level: AlertLevel;
  metricType?: HealthMetricType;
  metricValue?: number;
  message: string;
  dataTriggering?: HealthDataPoint[];
  behavioralContext?: BehavioralLog[];
  explanationRequested?: boolean;
  explanation?: string;
  originalLevel?: AlertLevel;
  isInsight?: boolean;
  userFeedback?: 'DISMISSED_ACKNOWLEDGED' | 'DISMISSED_EXPECTED' | 'DISMISSED_FALSE_ALARM';
  isDismissed?: boolean;
}

// Minimal metric config needed by backend health logic
export const METRIC_CONFIG_BACKEND: Record<HealthMetricType, { unit: string; name: string }> = {
  [HealthMetricType.HEART_RATE]: { unit: 'bpm', name: 'Heart Rate' },
  [HealthMetricType.GLUCOSE]: { unit: 'mg/dL', name: 'Glucose' },
  [HealthMetricType.SPO2]: { unit: '%', name: 'SpO2' },
  [HealthMetricType.SLEEP_HOURS]: { unit: 'hrs', name: 'Sleep' },
  [HealthMetricType.ACTIVITY_MINUTES]: { unit: 'mins', name: 'Activity' },
};

// Initial data constants for backend seeding (mirroring frontend's structure)
export const INITIAL_EHR_DATA: EHRData = {
  medications: ['Metformin 500mg', 'Lisinopril 10mg'],
  allergies: ['Penicillin'],
  diagnoses: ['Type 2 Diabetes', 'Hypertension'],
};

export const INITIAL_USER_THRESHOLDS: UserThresholds = {
  [HealthMetricType.HEART_RATE]: { low: 50, high: 100 },
  [HealthMetricType.GLUCOSE]: { low: 70, high: 180 }, // mg/dL
  [HealthMetricType.SPO2]: { low: 92, high: 100 }, // Percentage
  [HealthMetricType.SLEEP_HOURS]: { low: 7 },
  [HealthMetricType.ACTIVITY_MINUTES]: { low: 30 },
};

export const INITIAL_USER_DATA: UserData = {
  id: 'user-001', // This specific ID is used for seeding
  name: 'Jane Doe',
  age: 45,
  ehr: INITIAL_EHR_DATA,
  thresholds: INITIAL_USER_THRESHOLDS,
  allowAutoEscalation: true,
};
