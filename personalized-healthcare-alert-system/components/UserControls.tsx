
import React, { useState, useEffect } from 'react';
import { UserData, UserThresholds, HealthMetricType } from '../types';
import { METRIC_CONFIG } from '../constants';

interface UserControlsProps {
  userData: UserData;
  onUpdateThresholds: (newThresholds: UserThresholds) => void;
  onUpdateAutoEscalation: (allow: boolean) => void;
}

const UserControls: React.FC<UserControlsProps> = ({ userData, onUpdateThresholds, onUpdateAutoEscalation }) => {
  const [editableThresholds, setEditableThresholds] = useState<UserThresholds>(userData.thresholds);
  const [allowEscalation, setAllowEscalation] = useState<boolean>(userData.allowAutoEscalation);

  useEffect(() => {
    setEditableThresholds(userData.thresholds);
    setAllowEscalation(userData.allowAutoEscalation);
  }, [userData]);

  const handleThresholdChange = <T extends HealthMetricType, K extends keyof NonNullable<UserThresholds[T]>>(
    metric: T,
    key: K,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setEditableThresholds(prev => ({
        ...prev,
        [metric]: {
          ...prev[metric],
          [key]: numValue,
        },
      }));
    }
  };
  
  const handleSaveChanges = () => {
    onUpdateThresholds(editableThresholds);
  };

  const handleAutoEscalationToggle = () => {
    const newSetting = !allowEscalation;
    setAllowEscalation(newSetting);
    onUpdateAutoEscalation(newSetting);
  };
  
  const renderThresholdInput = (metric: HealthMetricType, type: 'low' | 'high') => {
    const config = METRIC_CONFIG[metric];
    const metricThresholds = editableThresholds[metric] as { low?: number; high?: number } | undefined;
  
    if (!metricThresholds || !(type in metricThresholds)) return null; // Skip if threshold type doesn't exist for metric (e.g. no 'high' for SpO2)

    // Ensure value is defined for input, default to 0 if not, although type guards should prevent this.
    const currentValue = metricThresholds[type] !== undefined ? metricThresholds[type] : 0;
  
    return (
      <div className="flex-1 min-w-[120px]">
        <label htmlFor={`${metric}-${type}`} className="block text-sm font-medium text-gray-700 capitalize">
          {type} ({config.unit})
        </label>
        <input
          type="number"
          id={`${metric}-${type}`}
          name={`${metric}-${type}`}
          value={currentValue}
          onChange={(e) => handleThresholdChange(metric, type as any, e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
        />
      </div>
    );
  };


  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Personalized Settings</h3>
      
      <div className="space-y-6">
        {Object.keys(editableThresholds).map((metricKey) => {
          const metric = metricKey as HealthMetricType;
          const config = METRIC_CONFIG[metric];
          const currentMetricThresholds = editableThresholds[metric];
          
          // Check if thresholds are defined for this metric
          if (!currentMetricThresholds) return null;

          return (
            <div key={metric} className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-md font-medium text-brand-primary mb-2">{config.name} Thresholds</h4>
              <div className="flex flex-wrap gap-4">
                { 'low' in currentMetricThresholds && renderThresholdInput(metric, 'low')}
                { 'high' in currentMetricThresholds && renderThresholdInput(metric, 'high')}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
              checked={allowEscalation}
              onChange={handleAutoEscalationToggle}
            />
            <span className="ml-2 text-gray-700">Allow Automatic Escalation to Care Provider</span>
          </label>
      </div>

      <button
        onClick={handleSaveChanges}
        className="mt-8 w-full bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-2 px-4 rounded-md transition-colors"
      >
        Save Threshold Changes
      </button>
    </div>
  );
};

export default UserControls;
    