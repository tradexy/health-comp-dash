
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { UserData, HealthDataPoint, BehavioralLog, INITIAL_USER_DATA } from '../types'; // Updated import

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'healthcompanion'; // Database name

let db: Db;
let usersCollection: Collection<UserData>;
let healthDataCollection: Collection<HealthDataPoint>;
let behavioralLogsCollection: Collection<BehavioralLog>;

export const connectToMongoDB = async (): Promise<void> => {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    usersCollection = db.collection<UserData>('users');
    healthDataCollection = db.collection<HealthDataPoint>('healthdata');
    behavioralLogsCollection = db.collection<BehavioralLog>('behaviorallogs');

    // Create indexes for faster queries
    await usersCollection.createIndex({ id: 1 }, { unique: true }); // UserData.id is 'user-001'
    await healthDataCollection.createIndex({ userId: 1, timestamp: -1 });
    await behavioralLogsCollection.createIndex({ userId: 1, timestamp: -1 });

    console.log(`Successfully connected to MongoDB: ${MONGODB_URI}, Database: ${DB_NAME}`);
    
    // Seed initial user data if user 'user-001' doesn't exist
    await seedInitialUserData();

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    (process as NodeJS.Process).exit(1); // Exit if DB connection fails // Cast process
  }
};

const seedInitialUserData = async () => {
    const defaultUser = await usersCollection.findOne({ id: INITIAL_USER_DATA.id });
    if (!defaultUser) {
        try {
            // Use $setOnInsert to prevent overwriting existing fields if somehow the doc exists but is partial
            // and to ensure we are setting the full INITIAL_USER_DATA object on creation.
            const initialUserDataForDB: Omit<UserData, '_id'> = { ...INITIAL_USER_DATA };

            const result = await usersCollection.findOneAndUpdate(
                { id: INITIAL_USER_DATA.id },
                { $setOnInsert: initialUserDataForDB },
                { upsert: true, returnDocument: 'after' }
            );
            if (result) { 
                 console.log(`Default user ${INITIAL_USER_DATA.id} seeded/verified successfully.`);
            } else {
                 // This case might occur if upsert happened but findOneAndUpdate for some reason didn't return the document.
                 // Or if the document was already there and $setOnInsert did nothing.
                 console.log(`Default user ${INITIAL_USER_DATA.id} processed (likely already exists or $setOnInsert applied).`);
            }
        } catch (error) {
            console.error(`Error seeding default user ${INITIAL_USER_DATA.id}:`, error);
        }
    } else {
        console.log(`Default user ${INITIAL_USER_DATA.id} already exists.`);
    }
};


// --- User Operations ---
export const getUserData = async (userId: string): Promise<UserData | null> => {
  if (!usersCollection) throw new Error("Users collection not initialized.");
  // Use the 'id' field which is 'user-001', not MongoDB's '_id'
  return usersCollection.findOne({ id: userId });
};

export const updateUserData = async (userData: UserData): Promise<UserData | null> => {
  if (!usersCollection) throw new Error("Users collection not initialized.");
  const { id, ...dataToUpdate } = userData;
  // Exclude _id if it's present in userData to avoid issues with immutable _id field
  if ('_id' in dataToUpdate) {
    delete (dataToUpdate as any)._id;
  }
  const result = await usersCollection.findOneAndUpdate(
    { id: id }, // Query by our custom 'id' field
    { $set: dataToUpdate },
    { returnDocument: 'after', upsert: true } // Upsert in case user doesn't exist yet
  );
  return result;
};

// --- HealthData Operations ---
export const addHealthDataPointToDB = async (dataPoint: Omit<HealthDataPoint, '_id'>): Promise<HealthDataPoint> => {
  if (!healthDataCollection) throw new Error("Health data collection not initialized.");
  const result = await healthDataCollection.insertOne(dataPoint as HealthDataPoint); // Cast after Omit
  return { ...dataPoint, _id: result.insertedId } as HealthDataPoint;
};

export const getRecentHealthDataFromDB = async (userId: string, limit: number = 10): Promise<HealthDataPoint[]> => {
  if (!healthDataCollection) throw new Error("Health data collection not initialized.");
  return healthDataCollection.find({ userId }).sort({ timestamp: -1 }).limit(limit).toArray();
};


// --- BehavioralLog Operations ---
export const addBehavioralLogToDB = async (log: Omit<BehavioralLog, '_id'>): Promise<BehavioralLog> => {
  if (!behavioralLogsCollection) throw new Error("Behavioral logs collection not initialized.");
  const result = await behavioralLogsCollection.insertOne(log as BehavioralLog);
  return { ...log, _id: result.insertedId } as BehavioralLog;
};

export const getRecentBehavioralLogsFromDB = async (userId: string, hours: number = 6, limit: number = 10): Promise<BehavioralLog[]> => {
  if (!behavioralLogsCollection) throw new Error("Behavioral logs collection not initialized.");
  const timeLimit = Date.now() - hours * 60 * 60 * 1000;
  return behavioralLogsCollection.find({ userId, timestamp: { $gte: timeLimit } }).sort({ timestamp: -1 }).limit(limit).toArray();
};