import { MongoClient, Db, Collection } from "mongodb";
import { config } from "./config";

let client: MongoClient;
let db: Db;

const uri = config.database.connectionString || "mongodb://localhost:27017/taskflow";
const dbName = config.database.databaseName || "taskflow";

export async function getUsersCollection(): Promise<Collection> {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return db.collection(config.database.collections!.users);
}
