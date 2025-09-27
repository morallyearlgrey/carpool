import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  beginLocation: {
    lat: { type: Number, required: true },
    long: { type: Number, required: true }
  },
  finalLocation: {
    lat: { type: Number, required: true },
    long: { type: Number, required: true }
  },

  date: { type: Date, required: true },

  startTime: { type: String, required: true }, // e.g., "08:30"
  finalTime: { type: String, required: true }, // e.g., "09:15"

//   // Optional preferences for matching
//   preferences: {
//     age: Number,
//     gender: { type: String, enum: ["male", "female", "other"] },
//     schoolwork: { type: String, enum: ["student", "employee", "both"] }
//   },

}, { timestamps: true });

const Offer = mongoose.models.Offer || mongoose.model("Offer", offerSchema);

export default Offer;