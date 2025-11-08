import { MongoClient, Db, Collection } from "mongodb";

let client: MongoClient;
let db: Db;

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/taskflow";
const dbName = process.env.MONGODB_DB || "taskflow";

export async function getUsersCollection(): Promise<Collection> {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return db.collection("users");
}
