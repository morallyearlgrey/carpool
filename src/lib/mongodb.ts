import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const options = {};

if (!MONGODB_URI) throw new Error("oh nooo");

let client: MongoClient; // only used inside block

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(MONGODB_URI, options);
  global._mongoClientPromise = client.connect();
}

const clientPromise = global._mongoClientPromise;

export default clientPromise;
