import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {type: String, required: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},

    vehicleInfo: {
        seatsAvailable: {type: Number},
        make: {type: String},
        model: {type: String},
        year: {type: String},

    },

    currentRide: { type: mongoose.Schema.Types.ObjectId, ref: "Ride" },
    rides: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ride" }],
    schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },

    requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Request" }],

    age: {type: Number},
    gender: {type: String},

})

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;