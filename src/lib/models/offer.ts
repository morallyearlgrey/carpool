import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  user: { type: String, required: true }, // store user id or email as string
  beginLocation: {
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
  },
  finalLocation: {
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
  },
  
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  finalTime: { type: String, required: true },
}, { timestamps: true });

const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);

export default Offer;
