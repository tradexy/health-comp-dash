
import React from 'react';
import { HealthDataPoint, Alert, AlertLevel, HealthMetricType, BehavioralLog, DietLog, MoodLog, ActivityLog } from '../types';
import { METRIC_CONFIG, HeartIcon, GlucoseIcon, LungIcon, BedIcon, ActivityIcon, InfoIcon, WarningIcon, DangerIcon, DietIcon, MoodIcon, LightbulbIcon } from '../constants';

interface RecentActivityFeedProps {
  healthDataStream: HealthDataPoint[];
  alerts: Alert[];
  behavioralLogs: BehavioralLog[];
}

const FeedItemIcon: React.FC<{ item: HealthDataPoint | Alert | BehavioralLog, className?: string }> = ({ item, className="w-5 h-5" }) => {
  if ('isInsight' in item && item.isInsight) {
    return <LightbulbIcon className={className} />;
  }
  if ('metricType' in item && item.metricType) { // It's an Alert with a specific metric
     switch (item.metricType) {
        case HealthMetricType.HEART_RATE: return <HeartIcon className={className} />;
        case HealthMetricType.GLUCOSE: return <GlucoseIcon className={className} />;
        case HealthMetricType.SPO2: return <LungIcon className={className} />;
        default: break; // Fall through to general alert icon
    }
  }
  
  if ('type' in item && 'value' in item) { // It's a HealthDataPoint
    const metricType = (item as HealthDataPoint).type;
    switch (metricType) {
      case HealthMetricType.HEART_RATE: return <HeartIcon className={className} />;
      case HealthMetricType.GLUCOSE: return <GlucoseIcon className={className} />;
      case HealthMetricType.SPO2: return <LungIcon className={className} />;
      case HealthMetricType.SLEEP_HOURS: return <BedIcon className={className} />;
      case HealthMetricType.ACTIVITY_MINUTES: return <ActivityIcon className={className} />;
      default: return <InfoIcon className={className} />;
    }
  } else if ('level' in item) { // It's an Alert
    switch ((item as Alert).level) {
      case AlertLevel.MILD: return <WarningIcon className={className} />;
      case AlertLevel.ESCALATION: return <DangerIcon className={className} />;
      case AlertLevel.INFO:
      default: return <InfoIcon className={className} />;
    }
  } else if ('logType' in item) { // It's a BehavioralLog
    switch ((item as BehavioralLog).logType) {
        case 'DIET': return <DietIcon className={className} />;
        case 'MOOD': return <MoodIcon className={className} />;
        case 'ACTIVITY': return <ActivityIcon className={className} />; // Or a specific one if you have it
        default: return <InfoIcon className={className} />;
    }
  }
  return <InfoIcon className={className} />;
};

const formatBehavioralLogMessage = (log: BehavioralLog): string => {
    switch (log.logType) {
        case 'DIET': return `Logged Diet: ${log.dietType}${log.details ? ` (${log.details})` : ''}${log.notes ? ` - Notes: ${log.notes}` : ''}`;
        case 'MOOD': return `Logged Mood: ${log.moodType}${log.notes ? ` - Notes: ${log.notes}` : ''}`;
        case 'ACTIVITY': return `Logged Activity: ${log.activityType} for ${log.durationMinutes} mins${log.notes ? ` - Notes: ${log.notes}` : ''}`;
        default:
          // This case should ideally not be reached if types are handled correctly
          const _exhaustiveCheck: never = log; // Ensures all cases are handled
          return "Logged Behavior";
    }
};

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ healthDataStream, alerts, behavioralLogs }) => {
  const combinedFeed = [
    ...healthDataStream.map(item => ({ ...item, itemType: 'data' as const, key: `data-${item.id}`})),
    ...alerts.map(item => ({ ...item, itemType: 'alert' as const, key: `alert-${item.id}`})),
    ...behavioralLogs.map(item => ({ ...item, itemType: 'behavioral' as const, key: `behavioral-${item.id}`})),
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 30); // Show latest 30 items

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity & Logs</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {combinedFeed.length === 0 && <p className="text-gray-500">No recent activity or logs.</p>}
        {combinedFeed.map((item) => (
          <div key={item.key} className="flex items-start space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors duration-150">
            <div className="flex-shrink-0 pt-1">
              <FeedItemIcon 
                item={item as HealthDataPoint | Alert | BehavioralLog} 
                className={`w-5 h-5 ${
                    item.itemType === 'alert' ? 
                        ((item as Alert).isInsight ? 'text-sky-500' : 
                         (item as Alert).level === AlertLevel.ESCALATION ? 'text-red-500' : 
                         (item as Alert).level === AlertLevel.MILD ? 'text-yellow-500' : 'text-blue-500') : 
                    item.itemType === 'behavioral' ? 'text-purple-500' : 'text-gray-500'
                }`}
              />
            </div>
            <div>
              <p className={`text-sm font-medium ${item.itemType === 'alert' && (item as Alert).isDismissed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                {item.itemType === 'data' ? 
                  `${METRIC_CONFIG[(item as HealthDataPoint).type].name}: ${(item as HealthDataPoint).value} ${(item as HealthDataPoint).unit}` : 
                item.itemType === 'alert' ?
                  `${(item as Alert).isInsight ? 'Insight' : (item as Alert).level + ' Alert'}: ${(item as Alert).message}` :
                item.itemType === 'behavioral' ?
                  formatBehavioralLogMessage(item as BehavioralLog) :
                  "Unknown item"
                }
              </p>
              <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
      </div>
       <style {...{jsx: true} as any}>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c4c4c4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </div>
  );
};

export default RecentActivityFeed;
