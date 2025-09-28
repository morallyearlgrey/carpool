import mongoose from 'mongoose';
import Ride from '../lib/models/ride';
import User from '../lib/models/user';
import mongooseConnect from '../lib/mongoose';

async function createRide() {
  await mongooseConnect;

  const driver = await User.findOne(); // pick any user
  if (!driver) return console.log('No users found');

  const ride = await Ride.create({
    driver: driver._id,
    date: new Date(),
    startTime: '08:30',
    endTime: '09:15',
    beginLocation: { lat: 28.602, long: -81.200 },
    finalLocation: { lat: 28.605, long: -81.210 },
    maxRiders: 4,
  });

  console.log('Ride created:', ride);
  process.exit(0);
}

createRide();
