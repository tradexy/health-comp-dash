import React from 'react';
import { Alert, AlertLevel } from '../types';
import { InfoIcon, WarningIcon, DangerIcon, BrainIcon, CheckCircleIcon, XCircleIcon, LightbulbIcon } from '../constants';

interface AlertNotificationProps {
  alert: Alert;
  onExplain: (alertId: string) => void;
  onDismiss: (alertId: string, feedback: Alert['userFeedback']) => void;
}

const AlertNotification: React.FC<AlertNotificationProps> = ({ alert, onExplain, onDismiss }) => {
  let bgColor = 'bg-blue-100 border-blue-500 text-blue-700';
  let Icon = alert.isInsight ? LightbulbIcon : InfoIcon;
  let title = alert.isInsight ? 'Insight' : `${alert.level} Alert`;

  if (!alert.isInsight) {
    switch (alert.level) {
      case AlertLevel.MILD:
        bgColor = 'bg-yellow-100 border-yellow-500 text-yellow-700';
        Icon = WarningIcon;
        break;
      case AlertLevel.ESCALATION:
        bgColor = 'bg-red-100 border-red-500 text-red-700';
        Icon = DangerIcon;
        break;
      case AlertLevel.INFO:
      default:
        // Icon already set to InfoIcon
        break;
    }
  } else {
     bgColor = 'bg-sky-100 border-sky-500 text-sky-700'; // Specific color for insights
  }
  
  if(alert.originalLevel === AlertLevel.ESCALATION && alert.level === AlertLevel.MILD) {
     bgColor = 'bg-yellow-100 border-yellow-500 text-yellow-700'; // Still show as warning
     Icon = WarningIcon; 
     title = `${alert.level} Alert (Originally Escalation)`;
  }

  if (alert.isDismissed) {
    bgColor = 'bg-gray-100 border-gray-400 text-gray-600';
    // Icon can remain or change to a generic "logged" icon if desired
  }


  return (
    <div className={`p-4 mb-4 rounded-lg border shadow-md ${bgColor} flex flex-col`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-start sm:items-center mb-2 sm:mb-0">
          <Icon className="w-6 h-6 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold">{title}</p>
            <p className={`text-sm ${alert.isDismissed ? 'line-through' : ''}`}>{alert.message}</p>
            <p className="text-xs text-gray-600 mt-1">
              {new Date(alert.timestamp).toLocaleString()}
              {alert.isDismissed && alert.userFeedback && <span className="ml-2 italic">({alert.userFeedback.replace(/_/g, ' ')})</span>}
            </p>
          </div>
        </div>
        {!alert.explanation && !alert.isDismissed && !alert.isInsight && ( // No "why" for insights for now, or dismissed alerts
          <button
            onClick={() => onExplain(alert.id)}
            disabled={alert.explanationRequested}
            className="mt-2 sm:mt-0 sm:ml-4 px-3 py-1.5 text-sm bg-brand-primary hover:bg-brand-secondary text-white rounded-md shadow-sm flex items-center disabled:opacity-50"
            aria-label="Get explanation for this alert"
          >
            <BrainIcon className="w-4 h-4 mr-2" />
            {alert.explanationRequested ? 'Loading...' : 'Why this alert?'}
          </button>
        )}
      </div>
      {!alert.isDismissed && !alert.isInsight && ( // Dismiss options not for insights
        <div className="mt-3 pt-3 border-t border-current opacity-50 flex flex-wrap gap-2 justify-end text-xs">
           <button 
            onClick={() => onDismiss(alert.id, 'DISMISSED_ACKNOWLEDGED')}
            className="px-2 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded flex items-center"
            aria-label="Dismiss and acknowledge alert"
            >
                <CheckCircleIcon className="w-4 h-4 mr-1"/> Acknowledge & Dismiss
            </button>
            <button 
            onClick={() => onDismiss(alert.id, 'DISMISSED_EXPECTED')}
            className="px-2 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded flex items-center"
            aria-label="Dismiss alert as expected"
            >
                <CheckCircleIcon className="w-4 h-4 mr-1"/> Expected, Dismiss
            </button>
             <button 
            onClick={() => onDismiss(alert.id, 'DISMISSED_FALSE_ALARM')}
            className="px-2 py-1 bg-red-400 hover:bg-red-500 text-white rounded flex items-center"
            aria-label="Dismiss alert as false alarm"
            >
                <XCircleIcon className="w-4 h-4 mr-1"/> False Alarm, Dismiss
            </button>
        </div>
      )}
    </div>
  );
};

export default AlertNotification;