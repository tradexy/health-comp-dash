
import React from 'react';
import { HealthDataPoint, UserData, HealthMetricType } from '../types';
import HealthDataDisplay from './HealthDataDisplay';
import { METRIC_CONFIG } from '../constants';


interface CurrentVitalsProps {
  healthDataStream: HealthDataPoint[];
  userData: UserData;
}

const CurrentVitals: React.FC<CurrentVitalsProps> = ({ healthDataStream, userData }) => {
  const latestData: { [key in HealthMetricType]?: HealthDataPoint } = {};

  for (const dataPoint of healthDataStream) {
    if (!latestData[dataPoint.type] || dataPoint.timestamp > latestData[dataPoint.type]!.timestamp) {
      latestData[dataPoint.type] = dataPoint;
    }
  }
  
  const displayOrder: HealthMetricType[] = [
    HealthMetricType.HEART_RATE,
    HealthMetricType.GLUCOSE,
    HealthMetricType.SPO2,
    HealthMetricType.SLEEP_HOURS,
    HealthMetricType.ACTIVITY_MINUTES,
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Current Vitals</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayOrder.map(metricType => (
                 <HealthDataDisplay
                    key={metricType}
                    metricType={metricType}
                    dataPoint={latestData[metricType]}
                    thresholds={userData.thresholds[metricType]}
                    displayLarge={metricType === HealthMetricType.HEART_RATE || metricType === HealthMetricType.GLUCOSE} // Example: make HR and Glucose larger
                />
            ))}
        </div>
    </div>
  );
};

export default CurrentVitals;
    