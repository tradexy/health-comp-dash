import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file in the server directory

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Alert, UserData, BehavioralLog, HealthDataPoint, DietLog, MoodLog, ActivityLog } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found on server (process.env.API_KEY is not set). Ensure it's in server/.env and dotenv is configured. Explanations will be mocked.");
} else {
  console.log("Gemini API Key loaded successfully on server.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const modelName = 'gemini-2.5-flash-preview-04-17';

const MOCK_EXPLANATION = "This is a mocked explanation (from server) because the Gemini API key is not configured or is invalid. AI would analyze data and provide details.";

const formatBehavioralLogForPrompt = (log: BehavioralLog): string => {
  const time = new Date(log.timestamp).toLocaleTimeString();
  switch (log.logType) {
    case 'DIET':
      return `Diet: ${(log as DietLog).dietType}${ (log as DietLog).details ? ` (${(log as DietLog).details})` : ''} at ${time}`;
    case 'MOOD':
      return `Mood: ${(log as MoodLog).moodType} at ${time}`;
    case 'ACTIVITY':
      return `Activity: ${(log as ActivityLog).activityType} for ${(log as ActivityLog).durationMinutes} mins${(log as ActivityLog).intensity ? ` (${(log as ActivityLog).intensity})` : ''} at ${time}`;
    default:
      return `Behavioral log at ${time}`;
  }
};

export const getAlertExplanationFromServer = async (
  alert: Alert, // Using frontend Alert type for now
  userData: UserData,
  recentBehavioralLogs?: BehavioralLog[]
): Promise<string> => {
  if (!ai) {
    return Promise.resolve(MOCK_EXPLANATION);
  }

  let dataTriggeringString = "Not specified.";
  if (alert.dataTriggering && alert.dataTriggering.length > 0) {
    dataTriggeringString = alert.dataTriggering.map(dp => `${dp.type}: ${dp.value} ${dp.unit} at ${new Date(dp.timestamp).toLocaleTimeString()}`).join(', ');
  } else if (alert.metricType && alert.metricValue) {
    dataTriggeringString = `${alert.metricType}: ${alert.metricValue}`;
  }
  
  let behavioralContextString = "No recent behavioral logs provided for context.";
  const combinedBehavioralContext: BehavioralLog[] = [];
  if (recentBehavioralLogs && recentBehavioralLogs.length > 0) {
    combinedBehavioralContext.push(...recentBehavioralLogs);
  }
  // Include context from the alert object itself if not already in recentBehavioralLogs (based on timestamp or ID)
  if (alert.behavioralContext) {
    alert.behavioralContext.forEach(acLog => {
      if (!combinedBehavioralContext.some(rbLog => rbLog.id === acLog.id || rbLog.timestamp === acLog.timestamp)) {
        combinedBehavioralContext.push(acLog);
      }
    });
  }
  
  if (combinedBehavioralContext.length > 0) {
     behavioralContextString = combinedBehavioralContext.sort((a,b) => a.timestamp - b.timestamp).map(formatBehavioralLogForPrompt).join('; ');
  }

  const prompt = `
    You are a Health Companion AI. A patient named ${userData.name}, aged ${userData.age}, received a health alert.
    Patient's relevant medical history:
    - Diagnoses: ${userData.ehr.diagnoses.join(', ') || 'None listed'}
    - Medications: ${userData.ehr.medications.join(', ') || 'None listed'}
    - Allergies: ${userData.ehr.allergies.join(', ') || 'None listed'}

    Alert details:
    - Type: ${alert.level} ${alert.isInsight ? '(This is an Insight)' : ''}
    - Message: "${alert.message}"
    - Data that may have triggered the alert: ${dataTriggeringString}
    - Relevant behavioral context: ${behavioralContextString}

    Please provide a concise and easy-to-understand explanation for why this alert/insight might have been triggered for this specific patient.
    If it's a direct health alert (not an insight), suggest general, safe, actionable next steps.
    If it's an insight, explain the observation and its potential meaning.
    Emphasize this is not medical advice and to consult their healthcare provider for serious concerns.
    Keep the explanation to 2-4 short paragraphs. Be empathetic and supportive.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
    });
    // Safely access the text property
    const textResponse = response.text;
    if (typeof textResponse === 'string') {
      return textResponse;
    }
    console.error("Gemini API response.text is undefined or not a string. Response:", response);
    return "Server received an unexpected response from the AI. Could not generate explanation.";
  } catch (error: any) {
    console.error("Error calling Gemini API on server:", error);
    if (error.message && (error.message.includes('API key not valid') || error.message.includes('invalid_api_key') || error.message.includes('API_KEY_INVALID'))) {
        return "Could not generate explanation: The API key is invalid or not authorized for this model. Please check server configuration (server/.env file and Google AI Studio settings).";
    }
    return `An error occurred on the server while generating the explanation. Details: ${error.message || String(error)}`;
  }
};