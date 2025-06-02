
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UserData, HealthDataPoint, Alert, AlertLevel, UserThresholds, HealthMetricType, 
  BehavioralLog, DietLog, MoodLog, ActivityLog, RiskAssessmentResult // RiskAssessmentResult is now from backend
} from './types';
import { 
  INITIAL_USER_DATA, METRIC_CONFIG, RefreshCwIcon, SettingsIcon, API_BASE_URL, PaperAirplaneIcon
} from './constants';
import { getAlertExplanation } from './services/geminiService'; // Frontend service
import { generateInsights } from './services/healthLogicService'; // Frontend service for insights
import AlertNotification from './components/AlertNotification';
import ExplanationModal from './components/ExplanationModal';
import UserControls from './components/UserControls';
import DataSimulator from './components/DataSimulator';
import CurrentVitals from './components/CurrentVitals';
import RecentActivityFeed from './components/RecentActivityFeed';
import BehavioralLogForm from './components/BehavioralLogForm';

const LOCAL_STORAGE_KEY_USER = 'healthCompanionUser';
const LOCAL_STORAGE_KEY_BEHAVIORAL_LOGS = 'healthCompanionBehavioralLogs';
// HealthDataStream and Alerts will be primarily managed via interaction with backend,
// but frontend keeps a local copy for display. Full persistence for these will be backend's job (MongoDB).

const loadStateFromLocalStorage = () => {
  try {
    const user = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
    const logs = localStorage.getItem(LOCAL_STORAGE_KEY_BEHAVIORAL_LOGS);
    return {
      currentUser: user ? JSON.parse(user) : INITIAL_USER_DATA,
      behavioralLogs: logs ? JSON.parse(logs) : [],
    };
  } catch (error) {
    console.error("Error loading state from localStorage:", error);
    return { currentUser: INITIAL_USER_DATA, behavioralLogs: [] };
  }
};

// Type guards - ensure they handle potential undefined properties from backend if types slightly differ
const isHealthDataPoint = (item: any): item is HealthDataPoint => 
  item && typeof item === 'object' && 'type' in item && typeof item.type === 'string' &&
  'value' in item && typeof item.value === 'number' && 
  'unit' in item && typeof item.unit === 'string' &&
  'timestamp' in item && typeof item.timestamp === 'number' && 
  'id' in item && typeof item.id === 'string';

const isBehavioralLog = (item: any): item is BehavioralLog =>
  item && typeof item === 'object' && 'logType' in item && typeof item.logType === 'string' &&
  'timestamp' in item && typeof item.timestamp === 'number' && 
  'id' in item && typeof item.id === 'string';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserData>(loadStateFromLocalStorage().currentUser);
  const [healthDataStream, setHealthDataStream] = useState<HealthDataPoint[]>([]); // Displayed on frontend
  const [alerts, setAlerts] = useState<Alert[]>([]); // Displayed on frontend
  const [behavioralLogs, setBehavioralLogs] = useState<BehavioralLog[]>(loadStateFromLocalStorage().behavioralLogs);
  
  const [activeAlertForExplanation, setActiveAlertForExplanation] = useState<Alert | null>(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showLogForm, setShowLogForm] = useState<boolean>(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(true);
  const [lastBackendError, setLastBackendError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(currentUser));
    } catch (error) {
      console.error("Error saving currentUser to localStorage:", error);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_BEHAVIORAL_LOGS, JSON.stringify(behavioralLogs));
    } catch (error) {
      console.error("Error saving behavioralLogs to localStorage:", error);
    }
  }, [behavioralLogs]);


  const recentBehavioralLogsForAssessment = useMemo(() => {
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    return behavioralLogs.filter(log => log.timestamp >= sixHoursAgo).sort((a,b) => b.timestamp - a.timestamp).slice(0, 10); // Max 10 recent logs
  }, [behavioralLogs]);


  const addHealthDataPoint = useCallback(async (newDataPoint: HealthDataPoint) => {
    // Optimistically update UI for health data stream
    setHealthDataStream(prevStream => {
      const newStream = [newDataPoint, ...prevStream];
      return newStream.length > 200 ? newStream.slice(0, 200) : newStream;
    });
    setLastBackendError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/healthdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dataPoint: newDataPoint, 
          userData: currentUser, 
          recentBehavioralLogs: recentBehavioralLogsForAssessment 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({error:"Failed to parse error from backend"}));
        throw new Error(`Backend error (${response.status}): ${errorData.error || response.statusText}`);
      }
      
      const assessmentResult = await response.json() as RiskAssessmentResult;

      if (assessmentResult.level && assessmentResult.level !== AlertLevel.NONE) {
        const newAlert: Alert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: assessmentResult.timestamp || Date.now(), // Use timestamp from assessment or current
          userId: currentUser.id,
          level: assessmentResult.level,
          message: assessmentResult.message,
          metricType: assessmentResult.metricType,
          metricValue: assessmentResult.metricValue,
          // Ensure dataTriggering and behavioralContext are correctly typed arrays
          dataTriggering: Array.isArray(assessmentResult.triggeringData) 
            ? assessmentResult.triggeringData.filter(isHealthDataPoint) 
            : (assessmentResult.triggeringData ? [assessmentResult.triggeringData].filter(isHealthDataPoint) : []),
          behavioralContext: Array.isArray(assessmentResult.behavioralContext) 
            ? assessmentResult.behavioralContext.filter(isBehavioralLog) 
            : (assessmentResult.behavioralContext ? [assessmentResult.behavioralContext].filter(isBehavioralLog) : []),
          originalLevel: assessmentResult.level, // This might need refinement if backend handles downgrade logic
          isInsight: assessmentResult.isInsight || false,
        };
         if (assessmentResult.level === AlertLevel.MILD && newAlert.message.includes("Escalation automatically downgraded")) {
            newAlert.originalLevel = AlertLevel.ESCALATION;
         }

        setAlerts(prevAlerts => {
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          const recentSimilarAlert = prevAlerts.find(a => 
            !a.isDismissed &&
            a.metricType === newAlert.metricType &&
            a.level === newAlert.level &&
            a.timestamp > fiveMinutesAgo
          );
          if (recentSimilarAlert && newAlert.level !== AlertLevel.ESCALATION && !newAlert.isInsight) {
            console.log("Skipping similar recent alert (client-side check):", newAlert.message);
            return prevAlerts;
          }
          const updatedAlerts = [newAlert, ...prevAlerts];
          return updatedAlerts.length > 50 ? updatedAlerts.slice(0, 50) : updatedAlerts; 
        });
      }
    } catch (error: any) {
      console.error("Error submitting health data to backend:", error);
      setLastBackendError(error.message || "Failed to communicate with backend for health data processing.");
      // Optionally, create a local "error" alert or revert optimistic update if critical
    }
  }, [currentUser, recentBehavioralLogsForAssessment]);

  const addBehavioralLog = async (
    logData: Omit<DietLog, 'id' | 'timestamp' | 'logType'> | Omit<MoodLog, 'id' | 'timestamp' | 'logType'> | Omit<ActivityLog, 'id' | 'timestamp' | 'logType'>, 
    type: BehavioralLog['logType']
  ) => {
    const newLogEntry: BehavioralLog = {
      ...logData,
      id: `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      logType: type,
    } as BehavioralLog; 

    // Optimistically update UI
    setBehavioralLogs(prevLogs => {
      const updatedLogs = [newLogEntry, ...prevLogs];
      return updatedLogs.length > 100 ? updatedLogs.slice(0, 100) : updatedLogs;
    });
    setShowLogForm(false);
    setLastBackendError(null);

    try {
        const response = await fetch(`${API_BASE_URL}/behaviorallog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLogEntry),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Failed to parse error from backend" }));
            throw new Error(`Backend error (${response.status}) storing behavioral log: ${errorData.error || response.statusText}`);
        }
        console.log("Behavioral log successfully sent to backend.");
        // Backend might return the stored log with a server-generated ID or confirmation
    } catch (error: any) {
        console.error("Error submitting behavioral log to backend:", error);
        setLastBackendError(error.message || "Failed to communicate with backend for behavioral log.");
        // Potentially revert optimistic update or mark log as "pending sync"
    }
  };
  
  useEffect(() => {
    const insightCheckInterval = setInterval(() => {
      const insights = generateInsights(currentUser, healthDataStream, behavioralLogs); // Client-side insights
      if (insights.length > 0) {
        setAlerts(prevAlerts => {
          const newInsightAlerts: Alert[] = insights.map(insight => ({
            id: `insight-client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: insight.timestamp,
            userId: currentUser.id,
            level: AlertLevel.INFO,
            message: insight.message,
            isInsight: true,
            dataTriggering: insight.triggeringData?.filter(isHealthDataPoint) || [],
            behavioralContext: insight.triggeringData?.filter(isBehavioralLog) || [],
          }));

          const uniqueNewInsights = newInsightAlerts.filter(ni => !prevAlerts.some(pa => pa.isInsight && pa.message === ni.message && (Date.now() - pa.timestamp < 24 * 60 * 60 * 1000)));
          
          if (uniqueNewInsights.length > 0) {
            const updatedAlerts = [...uniqueNewInsights, ...prevAlerts];
            return updatedAlerts.length > 50 ? updatedAlerts.slice(0, 50) : updatedAlerts;
          }
          return prevAlerts;
        });
      }
    }, 60000); 

    return () => clearInterval(insightCheckInterval);
  }, [currentUser, healthDataStream, behavioralLogs]);

  useEffect(() => {
    if (!isAutoSimulating) return;
    const simulationInterval = setInterval(() => {
      const metricTypes = Object.values(HealthMetricType);
      const randomMetricType = metricTypes[Math.floor(Math.random() * metricTypes.length)];
      const config = METRIC_CONFIG[randomMetricType];
      const thresholds = currentUser.thresholds[randomMetricType];
      let value = config.defaultSimValue(); 
      const abnormalChance = 0.15; 
      if (Math.random() < abnormalChance && thresholds) {
        const severityChance = Math.random();
        if ('low' in thresholds && 'high' in thresholds) {
            const range = thresholds.high - thresholds.low;
            if (severityChance < 0.33) value = thresholds.low - range * (0.15 + Math.random() * 0.1); 
            else if (severityChance < 0.66) value = thresholds.high + range * (0.15 + Math.random() * 0.1);
            else value = Math.random() > 0.5 ? thresholds.high + range * 0.05 : thresholds.low - range * 0.05;
        } else if ('low' in thresholds) { 
            if (severityChance < 0.5) value = thresholds.low - (randomMetricType === HealthMetricType.SPO2 ? (3 + Math.random()*2) : (1.5 + Math.random())); 
            else value = thresholds.low - (randomMetricType === HealthMetricType.SPO2 ? (1 + Math.random()*1) : (0.5 + Math.random()*0.5)); 
        }
      }
      value = Math.max(config.min, Math.min(config.max, Math.round(value * 10)/10));
      addHealthDataPoint({
        id: `autosim-${randomMetricType}-${Date.now()}`,
        timestamp: Date.now(),
        type: randomMetricType,
        value: value,
        unit: config.unit,
      });
    }, 7000); 
    return () => clearInterval(simulationInterval);
  }, [addHealthDataPoint, currentUser.thresholds, isAutoSimulating]);

  const handleExplainAlert = useCallback(async (alertId: string) => {
    const alertToExplain = alerts.find(a => a.id === alertId);
    if (alertToExplain && !alertToExplain.explanation && !alertToExplain.isInsight) {
      setActiveAlertForExplanation(alertToExplain);
      setIsExplanationLoading(true);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, explanationRequested: true } : a));
      setLastBackendError(null);
      
      const logsForExplanation = behavioralLogs.filter(log => 
        alertToExplain.timestamp - log.timestamp < 6 * 60 * 60 * 1000 && log.timestamp <= alertToExplain.timestamp
      ).sort((a,b) => b.timestamp - a.timestamp).slice(0, 5);

      try {
        // Call the frontend service, which in turn calls the backend
        const explanation = await getAlertExplanation(alertToExplain, currentUser, logsForExplanation);
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, explanation, explanationRequested: false } : a));
        setActiveAlertForExplanation(prev => prev && prev.id === alertId ? {...prev, explanation, explanationRequested: false} : prev);
      } catch (error: any) { // Catch errors from the service call itself (e.g., network)
        console.error("Failed to get explanation via service:", error);
        const errorMessage = error.message || "Unknown error fetching explanation.";
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, explanation: `Error: ${errorMessage}`, explanationRequested: false } : a));
        setActiveAlertForExplanation(prev => prev && prev.id === alertId ? {...prev, explanation: `Error: ${errorMessage}`, explanationRequested: false} : prev);
        setLastBackendError(errorMessage);
      } finally {
        setIsExplanationLoading(false); 
      }
    } else if (alertToExplain && alertToExplain.explanation) {
      setActiveAlertForExplanation(alertToExplain); 
      setIsExplanationLoading(false);
    }
  }, [alerts, currentUser, behavioralLogs]);

  const handleDismissAlert = (alertId: string, feedback: Alert['userFeedback']) => {
    setAlerts(prevAlerts => prevAlerts.map(alert =>
      alert.id === alertId ? { ...alert, isDismissed: true, userFeedback: feedback } : alert
    ));
  };

  const handleCloseExplanationModal = () => setActiveAlertForExplanation(null);
  const handleUpdateThresholds = (newThresholds: UserThresholds) => setCurrentUser(prev => ({ ...prev, thresholds: newThresholds }));
  const handleUpdateAutoEscalation = (allow: boolean) => setCurrentUser(prev => ({...prev, allowAutoEscalation: allow}));

  const activeAlerts = useMemo(() => alerts.filter(a => !a.isDismissed && !a.isInsight), [alerts]);
  const insights = useMemo(() => alerts.filter(a => a.isInsight), [alerts]);

  return (
    <div className="min-h-screen bg-slate-100 text-gray-800 p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-primary">Health Companion Dashboard</h1>
            <div className="flex items-center space-x-2 sm:space-x-3 mt-3 sm:mt-0">
              <button
                onClick={() => setShowLogForm(prev => !prev)}
                className="p-2 rounded-md hover:bg-slate-200 bg-white shadow-sm transition-colors text-brand-primary text-sm font-medium flex items-center"
                title="Log Diet/Mood/Activity"
              >
                <PaperAirplaneIcon className="w-5 h-5 mr-1.5"/> Log Behavior
              </button>
              <button
                onClick={() => setIsAutoSimulating(prev => !prev)}
                className={`p-2 rounded-full hover:bg-slate-200 transition-colors ${isAutoSimulating ? 'text-brand-primary' : 'text-gray-500'}`}
                title={isAutoSimulating ? "Pause Auto-Simulation" : "Resume Auto-Simulation"}
                aria-pressed={isAutoSimulating}
              >
                <RefreshCwIcon className={`w-6 h-6 ${isAutoSimulating ? 'animate-spin-slow' : ''}`} />
              </button>
              <button
                onClick={() => setShowSettings(prev => !prev)}
                className="p-2 rounded-full hover:bg-slate-200 transition-colors text-brand-primary"
                title="Settings"
                aria-expanded={showSettings}
              >
                <SettingsIcon className="w-6 h-6" />
              </button>
            </div>
        </div>
        <p className="text-slate-600 mt-1">Monitoring {currentUser.name}, {currentUser.age}. Diagnoses: {currentUser.ehr.diagnoses.join(', ')}.</p>
         {lastBackendError && (
          <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            <strong>Backend Communication Issue:</strong> {lastBackendError}
          </div>
        )}
      </header>

      <main className="space-y-8">
        <CurrentVitals healthDataStream={healthDataStream} userData={currentUser} />

        {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-40" onClick={() => setShowSettings(false)} role="dialog" aria-modal="true">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                     <UserControls 
                        userData={currentUser} 
                        onUpdateThresholds={handleUpdateThresholds}
                        onUpdateAutoEscalation={handleUpdateAutoEscalation}
                    />
                     <button onClick={() => setShowSettings(false)} className="mt-4 text-sm text-brand-primary hover:underline">Close Settings</button>
                </div>
            </div>
        )}

        {showLogForm && (
             <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-40" onClick={() => setShowLogForm(false)} role="dialog" aria-modal="true">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <BehavioralLogForm onSubmit={addBehavioralLog} />
                     <button onClick={() => setShowLogForm(false)} className="mt-4 text-sm text-brand-primary hover:underline">Cancel</button>
                </div>
            </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-semibold text-gray-700">Active Alerts ({activeAlerts.length})</h2>
                 {activeAlerts.length === 0 && <p className="text-gray-500 p-4 bg-white rounded-lg shadow">No active alerts.</p>}
                 <div className="space-y-4">
                    {activeAlerts.map(alert => (
                        <AlertNotification key={alert.id} alert={alert} onExplain={handleExplainAlert} onDismiss={handleDismissAlert} />
                    ))}
                 </div>

                 {insights.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold text-gray-700">Insights ({insights.length})</h2>
                        <div className="space-y-4 mt-4">
                            {insights.map(insight => (
                                <AlertNotification key={insight.id} alert={insight} onExplain={handleExplainAlert} onDismiss={handleDismissAlert} />
                            ))}
                        </div>
                    </div>
                 )}
            </div>
            <div className="lg:col-span-1">
                 <RecentActivityFeed healthDataStream={healthDataStream} alerts={alerts} behavioralLogs={behavioralLogs} />
            </div>
        </div>

        <DataSimulator currentUser={currentUser} onSimulateDataPoint={addHealthDataPoint} />

      </main>

      {activeAlertForExplanation && (
        <ExplanationModal
          alert={activeAlertForExplanation}
          onClose={handleCloseExplanationModal}
          isLoading={isExplanationLoading}
        />
      )}
      <footer className="text-center text-sm text-slate-500 mt-12 py-4 border-t border-slate-300">
        Personalized Healthcare Alert System &copy; {new Date().getFullYear()}. For demonstration purposes only. Not for medical use.
      </footer>
       <style dangerouslySetInnerHTML={{ __html: `
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default App;
