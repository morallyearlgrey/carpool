import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  requestSender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // requester
  requestReceiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who the request is sent to

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

  // Status tracking
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected", "cancelled"], 
    default: "pending" 
  },

  // Associated ride if request is for a specific ride
  associatedRide: { type: mongoose.Schema.Types.ObjectId, ref: "Ride" },

}, { timestamps: true });

const Request = mongoose.models.Request || mongoose.model("Request", requestSchema);

export default Request;