
import React, { useState } from 'react';
import { DIET_LOG_OPTIONS, MOOD_LOG_OPTIONS } from '../constants';
import { DietLogType, MoodLogType, DietLog, MoodLog, ActivityLog, BehavioralLog } from '../types';


interface BehavioralLogFormProps {
  onSubmit: (
    log: Omit<DietLog, 'id' | 'timestamp' | 'logType'> | Omit<MoodLog, 'id' | 'timestamp' | 'logType'> | Omit<ActivityLog, 'id' | 'timestamp' | 'logType'>, 
    type: BehavioralLog['logType']
  ) => void;
}


const BehavioralLogForm: React.FC<BehavioralLogFormProps> = ({ onSubmit }) => {
  const [logCategory, setLogCategory] = useState<BehavioralLog['logType']>('DIET');
  const [selectedDietType, setSelectedDietType] = useState<DietLogType>(DIET_LOG_OPTIONS[0]);
  const [dietDetails, setDietDetails] = useState('');
  const [selectedMoodType, setSelectedMoodType] = useState<MoodLogType>(MOOD_LOG_OPTIONS[0]);
  const [activityType, setActivityType] = useState('');
  const [activityDuration, setActivityDuration] = useState(30);
  const [activityIntensity, setActivityIntensity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | undefined>(undefined);
  const [generalNotes, setGeneralNotes] = useState('');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (logCategory === 'DIET') {
      onSubmit({ dietType: selectedDietType, details: dietDetails, notes: generalNotes }, 'DIET');
    } else if (logCategory === 'MOOD') {
      onSubmit({ moodType: selectedMoodType, notes: generalNotes }, 'MOOD');
    } else if (logCategory === 'ACTIVITY') {
      if (!activityType || activityDuration <=0) {
        alert("Please enter a valid activity type and duration.");
        return;
      }
      onSubmit({ activityType, durationMinutes: activityDuration, intensity: activityIntensity, notes: generalNotes }, 'ACTIVITY')
    }
    // Reset form
    setSelectedDietType(DIET_LOG_OPTIONS[0]);
    setDietDetails('');
    setSelectedMoodType(MOOD_LOG_OPTIONS[0]);
    setActivityType('');
    setActivityDuration(30);
    setActivityIntensity(undefined);
    setGeneralNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Log Behavior</h3>
      
      <div>
        <label htmlFor="logCategory" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          id="logCategory"
          value={logCategory}
          onChange={(e) => setLogCategory(e.target.value as BehavioralLog['logType'])}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
        >
          <option value="DIET">Diet</option>
          <option value="MOOD">Mood</option>
          <option value="ACTIVITY">Activity</option>
        </select>
      </div>

      {logCategory === 'DIET' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="dietType" className="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
            <select
              id="dietType"
              value={selectedDietType}
              onChange={(e) => setSelectedDietType(e.target.value as DietLogType)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            >
              {DIET_LOG_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dietDetails" className="block text-sm font-medium text-gray-700 mb-1">Details (Optional)</label>
            <input
              type="text"
              id="dietDetails"
              value={dietDetails}
              onChange={(e) => setDietDetails(e.target.value)}
              placeholder="e.g., Chicken salad, apple"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            />
          </div>
        </div>
      )}

      {logCategory === 'MOOD' && (
        <div>
          <label htmlFor="moodType" className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
          <select
            id="moodType"
            value={selectedMoodType}
            onChange={(e) => setSelectedMoodType(e.target.value as MoodLogType)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
          >
            {MOOD_LOG_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      )}

      {logCategory === 'ACTIVITY' && (
        <div className="space-y-4">
           <div>
            <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
            <input
              type="text"
              id="activityType"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              placeholder="e.g., Running, Walking, Cycling"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="activityDuration" className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              id="activityDuration"
              value={activityDuration}
              onChange={(e) => setActivityDuration(parseInt(e.target.value, 10))}
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              required
            />
          </div>
           <div>
            <label htmlFor="activityIntensity" className="block text-sm font-medium text-gray-700 mb-1">Intensity (Optional)</label>
            <select
              id="activityIntensity"
              value={activityIntensity || ''}
              onChange={(e) => setActivityIntensity(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' || undefined)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            >
              <option value="">Select Intensity (Optional)</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="generalNotes" className="block text-sm font-medium text-gray-700 mb-1">General Notes (Optional)</label>
        <textarea
          id="generalNotes"
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          rows={3}
          placeholder="Any additional context..."
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-2 px-4 rounded-md transition-colors"
      >
        Add Log Entry
      </button>
    </form>
  );
};

export default BehavioralLogForm;
