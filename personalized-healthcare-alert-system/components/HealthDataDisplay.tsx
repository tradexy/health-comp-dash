
import React from 'react';
import { HealthDataPoint, HealthMetricType, UserThresholds } from '../types';
import { METRIC_CONFIG, HeartIcon, GlucoseIcon, LungIcon, BedIcon, ActivityIcon } from '../constants';

interface HealthDataDisplayProps {
  dataPoint?: HealthDataPoint;
  metricType: HealthMetricType;
  thresholds: UserThresholds[HealthMetricType];
  displayLarge?: boolean;
}

const MetricIcon: React.FC<{ type: HealthMetricType; className?: string }> = ({ type, className }) => {
  switch (type) {
    case HealthMetricType.HEART_RATE:
      return <HeartIcon className={className} />;
    case HealthMetricType.GLUCOSE:
      return <GlucoseIcon className={className} />;
    case HealthMetricType.SPO2:
      return <LungIcon className={className} />;
    case HealthMetricType.SLEEP_HOURS:
      return <BedIcon className={className} />;
    case HealthMetricType.ACTIVITY_MINUTES:
      return <ActivityIcon className={className} />;
    default:
      return null;
  }
};

const HealthDataDisplay: React.FC<HealthDataDisplayProps> = ({ dataPoint, metricType, thresholds, displayLarge = false }) => {
  const config = METRIC_CONFIG[metricType];
  const value = dataPoint?.value;
  const unit = dataPoint?.unit || config.unit;

  let statusColor = 'text-gray-700';
  let statusBorder = 'border-gray-300';

  if (value !== undefined && thresholds) {
    if ('low' in thresholds && 'high' in thresholds) { // Range threshold (e.g. HR, Glucose)
      if (value < thresholds.low || value > thresholds.high) {
        statusColor = 'text-red-600';
        statusBorder = 'border-red-500';
      } else if (value < thresholds.low * 1.1 || value > thresholds.high * 0.9) { // Near threshold
        statusColor = 'text-yellow-600';
        statusBorder = 'border-yellow-500';
      } else {
        statusColor = 'text-green-600';
        statusBorder = 'border-green-500';
      }
    } else if ('low' in thresholds) { // Minimum threshold (e.g. SpO2 low, Sleep low)
      if (value < thresholds.low) {
        statusColor = 'text-red-600';
        statusBorder = 'border-red-500';
      } else if (value < thresholds.low * 1.1) {
         statusColor = 'text-yellow-600';
         statusBorder = 'border-yellow-500';
      } else {
        statusColor = 'text-green-600';
        statusBorder = 'border-green-500';
      }
    }
  }
  
  const cardClasses = displayLarge 
    ? `bg-white p-6 rounded-xl shadow-lg border-2 ${statusBorder} flex flex-col items-center justify-center transition-all duration-300`
    : `bg-white p-4 rounded-lg shadow-md border ${statusBorder} flex items-center space-x-3 transition-all duration-300`;

  const iconSize = displayLarge ? "w-12 h-12" : "w-8 h-8";
  const valueSize = displayLarge ? "text-5xl font-bold" : "text-2xl font-semibold";
  const nameSize = displayLarge ? "text-xl text-gray-600" : "text-md text-gray-500";
  const unitSize = displayLarge ? "text-lg text-gray-500" : "text-sm text-gray-500";


  return (
    <div className={cardClasses}>
      <MetricIcon type={metricType} className={`${iconSize} ${statusColor} mb-1 ${displayLarge ? 'mb-3' : ''}`} />
      <div className={displayLarge ? 'text-center' : ''}>
        <p className={`${nameSize}`}>{config.name}</p>
        {value !== undefined ? (
          <p className={`${valueSize} ${statusColor}`}>
            {Math.round(value * 10) / 10} <span className={unitSize}>{unit}</span>
          </p>
        ) : (
          <p className={`${valueSize} text-gray-400`}>--</p>
        )}
         {displayLarge && thresholds && (
            <p className="text-xs text-gray-500 mt-1">
              { 'low' in thresholds && 'high' in thresholds ? `Target: ${thresholds.low}-${thresholds.high} ${unit}` : 
                'low' in thresholds ? `Target: >${thresholds.low} ${unit}` : ''}
            </p>
        )}
      </div>
    </div>
  );
};

export default HealthDataDisplay;
    