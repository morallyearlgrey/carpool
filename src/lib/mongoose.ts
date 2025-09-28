import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your environment variables");
}

declare global {
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

export default async function mongooseConnect() {
  if (mongoose.connection.readyState >= 1) return mongoose; // already connected

  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose.connect(MONGODB_URI).then((m) => {
      console.log("MongoDB connected");
      return m;
    });
  }

  return global._mongoosePromise;
}
