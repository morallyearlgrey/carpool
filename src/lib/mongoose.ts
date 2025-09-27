import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  // throw here would break builds; log instead and let callers handle
  console.warn('MONGODB_URI not set');
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

if (!global._mongoosePromise) {
  // create the promise once in the global scope (works for serverless)
  global._mongoosePromise = mongoose.connect(MONGODB_URI || '').then(m => {
    console.debug('mongoose connected');
    return mongoose;
  }).catch(err => {
    console.error('mongoose connect error', err && err.message ? err.message : err);
    throw err;
  });
}

export default global._mongoosePromise;
