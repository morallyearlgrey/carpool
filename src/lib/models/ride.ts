import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    riders: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        request: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
        orderPickUp: { type: Number },

    }],

    date: { type: Date, required: true },
    startTime: { type: String }, // e.g. "08:30"
    endTime: { type: String },    // e.g. "15:45"

    beginLocation: { lat: Number, long: Number },
    finalLocation: {  lat: Number, long: Number },
    requestedRiders: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    maxRiders: {type: Number, required: true}
}, { timestamps: true })


const Ride = mongoose.models.Ride || mongoose.model("Ride", rideSchema);
    
export default Ride;