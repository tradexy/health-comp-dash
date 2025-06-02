
import dotenv from 'dotenv';
dotenv.config(); // Load .env file from the server's root directory

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import {
  UserData,
  RiskAssessmentResult,
  AddHealthDataRequest,
  ExplainAlertRequest,
  Alert, 
  BehavioralLog 
} from './types';
import { HealthMetricType } from './types'; // Import HealthMetricType
import { getAlertExplanationFromServer } from './services/geminiService';
import { assessSingleDataPointRiskOnServer } from './services/healthLogicService';
import { fetchPersonalizedThresholds } from './services/mlService'; // NEW IMPORT
import { 
    connectToMongoDB, 
    getUserData, 
    updateUserData, 
    addHealthDataPointToDB, 
    addBehavioralLogToDB,
    getRecentBehavioralLogsFromDB
} from './services/mongoService';

// Global error handlers
(process as NodeJS.Process).on('unhandledRejection', (reason, promise) => {
  console.error('SERVER UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
  // Optionally, add logic to gracefully shut down or restart, but logging is key.
});

(process as NodeJS.Process).on('uncaughtException', (error) => {
  console.error('SERVER UNCAUGHT EXCEPTION THROWN:', error);
  // It's generally recommended to exit the process after an uncaught exception,
  // as the application might be in an inconsistent state.
  // For development, you might just log it, but for production, exiting is safer.
  // process.exit(1); // Consider uncommenting for stricter error handling
});


const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // Use express.json() directly


connectToMongoDB().catch(error => {
    console.error("Application startup error connecting to MongoDB:", error);
    (process as NodeJS.Process).exit(1);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Personalized Healthcare Alert System Backend is running with MongoDB!');
});

app.post('/api/healthdata', async (req: Request, res: Response) => {
  try {
    const { dataPoint: clientDataPoint, userData: clientUserData } = req.body as AddHealthDataRequest;

    if (!clientDataPoint || !clientUserData || !clientUserData.id) {
      return res.status(400).json({ error: 'Missing dataPoint, userData, or userData.id in request body' });
    }

    const currentUserInDB = await updateUserData(clientUserData);
    if (!currentUserInDB) {
        return res.status(500).json({ error: "Failed to update or retrieve user data from database." });
    }

    // --- NEW ML Service Integration Logic ---
    const ONE_DAY_MS = 24 * 60 * 60 * 1000; // Milliseconds in a day (for on-demand update frequency)
    const now = Date.now();

    let shouldUpdateThresholds = false;
    // Check if last update was more than a day ago, or if it's never been set
    if (!currentUserInDB.lastThresholdAdjustment || (now - currentUserInDB.lastThresholdAdjustment > ONE_DAY_MS)) {
      shouldUpdateThresholds = true;
      console.log(`User ${currentUserInDB.id}: Personalized thresholds due for update.`);
    }

    if (shouldUpdateThresholds) {
      // Fetch personalized thresholds for relevant metrics
      const newGlucoseThresholds = await fetchPersonalizedThresholds(currentUserInDB.id, HealthMetricType.GLUCOSE);
      const newHeartRateThresholds = await fetchPersonalizedThresholds(currentUserInDB.id, HealthMetricType.HEART_RATE);

      // Apply updates if new thresholds are returned
      if (newGlucoseThresholds) {
        currentUserInDB.thresholds[HealthMetricType.GLUCOSE] = newGlucoseThresholds;
        console.log(`User ${currentUserInDB.id}: Updated GLUCOSE thresholds to`, newGlucoseThresholds);
      }
      if (newHeartRateThresholds) {
        currentUserInDB.thresholds[HealthMetricType.HEART_RATE] = newHeartRateThresholds;
        console.log(`User ${currentUserInDB.id}: Updated HEART_RATE thresholds to`, newHeartRateThresholds);
      }

      // Update the timestamp and persist changes to MongoDB
      currentUserInDB.lastThresholdAdjustment = now;
      await updateUserData(currentUserInDB); // Persist updated thresholds and timestamp
      console.log(`User ${currentUserInDB.id}: Personalized thresholds updated and saved.`);
    }
    // --- END NEW ML Service Integration Logic ---

    const dataPointToSave = { ...clientDataPoint, userId: currentUserInDB.id };
    await addHealthDataPointToDB(dataPointToSave);

    const recentBehavioralLogsFromDB = await getRecentBehavioralLogsFromDB(currentUserInDB.id, 6, 10);

    const assessmentResult: RiskAssessmentResult = assessSingleDataPointRiskOnServer(
      currentUserInDB, // Pass the potentially updated user data
      dataPointToSave,
      recentBehavioralLogsFromDB
    );

    res.status(201).json(assessmentResult);

  } catch (error: any) {
    console.error('Error processing /api/healthdata:', error);
    res.status(500).json({ error: 'Internal server error while processing health data', details: error.message });
  }
});

app.post('/api/explain', async (req: Request, res: Response) => {
  try {
    const { alert, userData: clientUserData } = req.body as ExplainAlertRequest;

    if (!alert || !clientUserData || !clientUserData.id) {
      return res.status(400).json({ error: 'Missing alert, userData, or userData.id in request' });
    }
    
    const currentUserInDB = await updateUserData(clientUserData);
     if (!currentUserInDB) {
        return res.status(500).json({ error: "Failed to update or retrieve user data from database for explanation." });
    }

    const recentBehavioralLogsFromDB = await getRecentBehavioralLogsFromDB(currentUserInDB.id, 6, 5);

    const explanation = await getAlertExplanationFromServer(alert, currentUserInDB, recentBehavioralLogsFromDB);
    res.status(200).json({ explanation });

  } catch (error: any) {
    console.error('Error processing /api/explain:', error);
    res.status(500).json({ error: 'Internal server error while processing explanation request', details: error.message });
  }
});

app.post('/api/behaviorallog', async (req: Request, res: Response) => {
  try {
    const logDataFromClient = req.body as Omit<BehavioralLog, '_id' | 'userId'>; 
    
    const userId = 'user-001'; 

    if(!logDataFromClient || !logDataFromClient.logType || !logDataFromClient.timestamp || !logDataFromClient.id) {
        return res.status(400).json({ error: 'Invalid behavioral log data.' });
    }

    const logToSave: Omit<BehavioralLog, '_id'> = { ...logDataFromClient, userId };
    const savedLog = await addBehavioralLogToDB(logToSave);

    console.log(`Behavioral log received and stored in MongoDB: ${savedLog.logType} - ${savedLog.id}`);
    res.status(201).json(savedLog);
  } catch (error: any) {
    console.error('Error processing /api/behaviorallog:', error);
    res.status(500).json({ error: 'Internal server error while processing behavioral log', details: error.message });
  }
});


app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
  if (!process.env.API_KEY) {
    console.warn('Warning: API_KEY is not set in the environment. Gemini API calls will be mocked. Create server/.env file with API_KEY=YOUR_KEY.');
  } else {
    console.log('API_KEY is loaded in the server environment.');
  }
  if (!process.env.MONGODB_URI) {
    console.warn('Warning: MONGODB_URI is not set. Defaulting to mongodb://localhost:27017. Ensure MongoDB is running or set MONGODB_URI in server/.env.');
  }
  if (!process.env.ML_SERVICE_BASE_URL) { // NEW CHECK
    console.warn('Warning: ML_SERVICE_BASE_URL is not set. ML service integration may not work. Set ML_SERVICE_BASE_URL in server/.env.');
  } else {
    console.log(`ML_SERVICE_BASE_URL is loaded: ${process.env.ML_SERVICE_BASE_URL}`);
  }
});

// Fallback error handler for Express
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("EXPRESS FALLBACK ERROR HANDLER:", err.stack);
  if (!res.headersSent) {
    res.status(500).send('Something broke!');
  }
});
