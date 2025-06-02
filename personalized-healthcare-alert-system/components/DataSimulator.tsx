
import React from 'react';
import { HealthMetricType, HealthDataPoint, UserData } from '../types';
import { METRIC_CONFIG } from '../constants';

interface DataSimulatorProps {
  currentUser: UserData;
  onSimulateDataPoint: (dataPoint: HealthDataPoint) => void;
}

const DataSimulator: React.FC<DataSimulatorProps> = ({ currentUser, onSimulateDataPoint }) => {
  
  const simulateEvent = (metricType: HealthMetricType, severity: 'normal' | 'mild_abnormal' | 'critical_abnormal') => {
    const config = METRIC_CONFIG[metricType];
    const thresholds = currentUser.thresholds[metricType];
    let value = config.defaultSimValue();

    if (thresholds) {
        if ('low' in thresholds && 'high' in thresholds) { // Range type
            const range = thresholds.high - thresholds.low;
            if (severity === 'mild_abnormal') {
                value = Math.random() > 0.5 ? thresholds.high + range * 0.15 : thresholds.low - range * 0.15;
            } else if (severity === 'critical_abnormal') {
                value = Math.random() > 0.5 ? thresholds.high + range * 0.35 : thresholds.low - range * 0.35;
            } else { // normal
                 value = thresholds.low + range * (0.25 + Math.random() * 0.5); // within middle 50% of normal range
            }
        } else if ('low' in thresholds) { // Minimum type (SpO2, Sleep)
             if (severity === 'mild_abnormal') {
                value = thresholds.low - (metricType === HealthMetricType.SPO2 ? 2 : 1); // SpO2 drops less dramatically initially
            } else if (severity === 'critical_abnormal') {
                value = thresholds.low - (metricType === HealthMetricType.SPO2 ? 5 : 2.5);
            } else { // normal
                value = thresholds.low + (metricType === HealthMetricType.SPO2 ? (Math.random() * (100-thresholds.low)) : (Math.random() * 3));
            }
        }
    }
    
    // Clamp values to reasonable min/max for the metric
    value = Math.max(config.min, Math.min(config.max, Math.round(value * 10)/10));


    const newDataPoint: HealthDataPoint = {
      id: `sim-${metricType}-${Date.now()}`,
      timestamp: Date.now(),
      type: metricType,
      value: value,
      unit: config.unit,
    };
    onSimulateDataPoint(newDataPoint);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Simulation Controls</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(HealthMetricType) as Array<keyof typeof HealthMetricType>).map((key) => {
          const metricType = HealthMetricType[key];
          const config = METRIC_CONFIG[metricType];
          return (
            <div key={metricType} className="p-3 border border-gray-200 rounded-lg">
              <p className="font-medium text-brand-primary mb-2">{config.name}</p>
              <div className="space-y-2">
                <button 
                  onClick={() => simulateEvent(metricType, 'normal')}
                  className="w-full text-sm bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded-md"
                >
                  Simulate Normal
                </button>
                <button 
                  onClick={() => simulateEvent(metricType, 'mild_abnormal')}
                  className="w-full text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 px-3 rounded-md"
                >
                  Simulate Mildly Abnormal
                </button>
                 <button 
                  onClick={() => simulateEvent(metricType, 'critical_abnormal')}
                  className="w-full text-sm bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded-md"
                >
                  Simulate Critically Abnormal
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataSimulator;
    