import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.warn('MONGODB_URI not set');
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

if (!global._mongoosePromise) {
  global._mongoosePromise = mongoose.connect(MONGODB_URI || '', {
    // Explicitly specify the database name
    dbName: 'carpool'
  }).then(m => {
    console.debug('mongoose connected to carpool database');
    return mongoose;
  }).catch(err => {
    console.error('mongoose connect error', err && err.message ? err.message : err);
    throw err;
  });
}

export default global._mongoosePromise;