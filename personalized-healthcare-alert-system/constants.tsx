
import React from 'react';
import { UserData, HealthMetricType, EHRData, UserThresholds, DietLogType, MoodLogType } from './types';

export const API_BASE_URL = 'http://localhost:3001/api'; // Backend server URL

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
  id: 'user-001',
  name: 'Jane Doe',
  age: 45,
  ehr: INITIAL_EHR_DATA,
  thresholds: INITIAL_USER_THRESHOLDS,
  allowAutoEscalation: true,
};

export const METRIC_CONFIG: Record<HealthMetricType, { unit: string; name: string, defaultSimValue: () => number, min: number, max: number }> = {
  [HealthMetricType.HEART_RATE]: { unit: 'bpm', name: 'Heart Rate', defaultSimValue: () => 70 + Math.floor(Math.random() * 20 - 10), min: 30, max: 200 },
  [HealthMetricType.GLUCOSE]: { unit: 'mg/dL', name: 'Glucose', defaultSimValue: () => 100 + Math.floor(Math.random() * 40 - 20), min: 40, max: 400 },
  [HealthMetricType.SPO2]: { unit: '%', name: 'SpO2', defaultSimValue: () => 97 + Math.floor(Math.random() * 3 - 1), min: 80, max: 100 },
  [HealthMetricType.SLEEP_HOURS]: { unit: 'hrs', name: 'Sleep', defaultSimValue: () => 7 + Math.floor(Math.random() * 3 - 1.5), min: 0, max: 16 },
  [HealthMetricType.ACTIVITY_MINUTES]: { unit: 'mins', name: 'Activity', defaultSimValue: () => 30 + Math.floor(Math.random() * 30 - 15), min: 0, max: 300 },
};

export const DIET_LOG_OPTIONS: DietLogType[] = Object.values(DietLogType);
export const MOOD_LOG_OPTIONS: MoodLogType[] = Object.values(MoodLogType);


// --- ICONS ---

export const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
    <path d="M11.645 20.91a.75.75 0 0 1-1.29 0C8.492 18.496 3.015 14.003 2.59 9.292c-.456-5.07 3.329-8.92 8.001-8.92A7.016 7.016 0 0 1 17.41 9.292c-.424 4.71-5.901 9.198-7.765 11.618Z" />
  </svg>
);

export const GlucoseIcon: React.FC<{ className?: string }> = ({ className }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-.53 14.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V8.25a.75.75 0 0 0-1.5 0v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3Z" clipRule="evenodd" />
  </svg>
);

export const LungIcon: React.FC<{ className?: string }> = ({ className }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
    <path d="M12 2c1.103 0 2 .897 2 2v2.051c1.206.213 2.32.694 3.262 1.384.941.69 1.738 1.602 2.312 2.655.575 1.053.863 2.198.863 3.416 0 2.238-.755 4.27-2.262 6.106-.578.696-1.216 1.334-1.912 1.912-1.388 1.152-2.996 1.737-4.825 1.737s-3.437-.585-4.825-1.737c-.696-.578-1.334-1.216-1.912-1.912C3.755 17.78 3 15.748 3 13.51c0-1.218.288-2.362.863-3.416.574-1.053 1.37-1.965 2.312-2.655.941-.69 2.056-1.17 3.262-1.384V4c0-1.103.897-2 2-2Zm0 2c-.839 0-1.356.886-2.002 1.507-.646.621-1.446 1.038-2.498 1.244-.804.16-1.52.492-2.09.93-.57.437-1.018.996-1.293 1.602C3.438 10.045 3.3 10.69 3.3 11.25c0 .52.067.988.202 1.404.269.828.767 1.561 1.486 2.2C5.707 15.572 6.53 16.13 7.5 16.5c.97.37 2.044.554 3.225.554h.55c1.181 0 2.255-.185 3.225-.554.97-.37 1.793-.928 2.512-1.642.719-.719 1.217-1.448 1.486-2.2.135-.416.202-.883.202-1.404 0-.56-.138-1.205-.417-1.963-.275-.606-.723-1.165-1.293-1.602-.57-.437-1.286-.77-2.09-.93-.978-.197-1.852-.623-2.498-1.244C13.356 4.886 12.839 4 12 4Z"/>
  </svg>
);

export const BedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
    <path fillRule="evenodd" d="M3.75 7.5a1.5 1.5 0 0 1 1.5-1.5h13.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-13.5a1.5 1.5 0 0 1-1.5-1.5v-9Zm1.5-3a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-13.5Zm6 4.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75v-3Z" clipRule="evenodd" />
    <path d="M5.25 9.75A.75.75 0 0 1 6 9h2.25a.75.75 0 0 1 0 1.5H6a.75.75 0 0 1-.75-.75Z" />
  </svg>
);

export const ActivityIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
    <path fillRule="evenodd" d="M10.5 3.75a.75.75 0 0 1 .75.75V8.25h3.75a.75.75 0 0 1 0 1.5H11.25V18a.75.75 0 0 1-1.5 0V9.75H6a.75.75 0 0 1 0-1.5h3.75V4.5a.75.75 0 0 1 .75-.75Zm4.418 4.045a.75.75 0 0 1 .816.976l-2.872 7.019a.75.75 0 0 1-1.44-.59l2.34-5.716-3.442 2.008a.75.75 0 1 1-.75-1.299l4.5-2.625a.75.75 0 0 1 .854.223Z" clipRule="evenodd" />
    <path d="M12 2.25a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 1.5 0v-1.5A.75.75 0 0 0 12 2.25Zm0 16.5a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 1.5 0v-1.5a.75.75 0 0 0-.75-.75ZM4.5 11.25a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 1.5 0v-1.5a.75.75 0 0 0-.75-.75ZM18 11.25a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 1.5 0v-1.5a.75.75 0 0 0-.75-.75Z" />
  </svg>
);

export const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

export const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" />
  </svg>
);

export const DangerIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
  </svg>
);

export const RefreshCwIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.097-1.284C11.526 2.305 12.256 2 13.05 2v.003c.636 0 1.29.252 1.743.718.422.422.683.983.683 1.594v.006c0 .611-.261 1.172-.683 1.594-.453.466-1.107.718-1.743.718H13.05v.003c-.794 0-1.523-.305-2.057-.834C10.478 5.423 10 4.74 10 3.946v.001Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.788 3.75c-.746-1.051-1.913-1.752-3.288-1.752V2c1.793 0 3.34.768 4.366 1.995M12.212 12.75c.746 1.051 1.913 1.752 3.288 1.752V15c-1.793 0-3.34-.768-4.366-1.995M10.788 12.75c-.746-1.051-1.913-1.752-3.288-1.752V12c1.793 0 3.34.768 4.366 1.995m0-8.25c-.746-1.051-1.913-1.752-3.288-1.752V4.5c1.793 0 3.34.768 4.366 1.995M10.788 4.5c-.746-1.051-1.913-1.752-3.288-1.752V3c1.793 0 3.34.768 4.366 1.995M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

export const BrainIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75H19.5M8.25 3.75A2.25 2.25 0 0 0 6 6v12a2.25 2.25 0 0 0 2.25 2.25h11.25V3.75M8.25 3.75c0-.621.504-1.125 1.125-1.125H19.5M16.5 5.25h.008v.008H16.5V5.25Zm0 2.25h.008v.008H16.5V7.5Zm0 2.25h.008v.008H16.5V9.75Zm0 2.25h.008v.008H16.5V12Zm0 2.25h.008v.008H16.5V14.25Zm0 2.25h.008v.008H16.5V16.5Zm0 2.25h.008v.008H16.5V18.75m-5.625-3.75a.75.75 0 0 0-1.5 0v2.25a.75.75 0 0 0 1.5 0V15M5.25 5.25h.008v.008H5.25V5.25Zm0 2.25h.008v.008H5.25V7.5Zm0 2.25h.008v.008H5.25V9.75Zm0 2.25h.008v.008H5.25V12M5.25 15h.008v.008H5.25V15Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a.75.75 0 0 0 0-1.5H12a.75.75 0 0 0 0 1.5ZM11.25 3.75A2.25 2.25 0 0 0 9 6v12a2.25 2.25 0 0 0 2.25 2.25M12.75 3.75A2.25 2.25 0 0 1 15 6v12a2.25 2.25 0 0 1-2.25 2.25" />
  </svg>
);

export const DietIcon: React.FC<{ className?: string }> = ({ className }) => ( // Fork and Knife
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.608a8.287 8.287 0 0 0 3 2.472A8.288 8.288 0 0 0 15 9.608a8.287 8.287 0 0 0 .362-4.394ZM12 12.75a2.25 2.25 0 0 0 2.25-2.25H9.75A2.25 2.25 0 0 0 12 12.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 1.657-.504 3.194-1.388 4.5H18a3.75 3.75 0 0 0 3.75-3.75V9A3.75 3.75 0 0 0 18 5.25h-.388A11.17 11.17 0 0 1 19.5 10.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 10.5c0-1.657.504-3.194 1.388-4.5H3.75A3.75 3.75 0 0 1 0 9.75V12A3.75 3.75 0 0 1 3.75 15.75h.138A11.17 11.17 0 0 0 2.25 10.5Z" />
  </svg>
);

export const MoodIcon: React.FC<{ className?: string }> = ({ className }) => ( // Simple Face
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9.75h.008v.008H9V9.75Zm6 0h.008v.008H15V9.75Z" />
  </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => ( // For insights
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.354a15.054 15.054 0 0 1-4.5 0M3.453 12.453A6 6 0 0 1 7.5 7.5h9a6 6 0 0 1 4.047 4.953m-16.14-.135a5.975 5.975 0 0 1 .24-2.268M20.547 12.318a5.975 5.975 0 0 0 .24-2.268" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75A2.25 2.25 0 0 1 14.25 9v1.083c0 .736.24 1.41.652 1.972.41.561.942.99 1.548 1.258V15a2.25 2.25 0 0 1-2.25 2.25H9.75A2.25 2.25 0 0 1 7.5 15v-2.687c.606-.268 1.138-.697 1.548-1.258.412-.562.652-1.236.652-1.972V9A2.25 2.25 0 0 1 12 6.75Z" />
  </svg>
);
export const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);
