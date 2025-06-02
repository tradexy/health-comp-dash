import { Alert, UserData, BehavioralLog } from '../types';
import { API_BASE_URL } from '../constants';

// This frontend service now acts as a client to our backend API for Gemini functions.

const MOCK_EXPLANATION_FRONTEND = "Could not reach backend for explanation. This is a mocked explanation. Please ensure the backend server is running and accessible. In a real scenario, AI would analyze your data and provide a detailed reason for this alert.";

export const getAlertExplanation = async (
  alert: Alert, 
  userData: UserData, 
  recentBehavioralLogs?: BehavioralLog[]
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alert, userData, recentBehavioralLogs }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to parse error response from backend." }));
      console.error("Error fetching explanation from backend:", response.status, errorData);
      return `Error from backend (${response.status}): ${errorData.detail || response.statusText}. Using mock.`;
    }

    const data = await response.json();
    return data.explanation;

  } catch (error) {
    console.error("Network or other error fetching explanation from backend:", error);
    return MOCK_EXPLANATION_FRONTEND;
  }
};
