import { MongoClient, Db, Collection } from "mongodb";
import { config } from "./config";

const uri = config.database.connectionString || "mongodb://localhost:27017/taskflow";
const dbName = config.database.databaseName || "taskflow";

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getUsersCollection(): Promise<Collection> {
  const connectedClient = await clientPromise;
  const db = connectedClient.db(dbName);
  return db.collection(config.database.collections!.users);
}

