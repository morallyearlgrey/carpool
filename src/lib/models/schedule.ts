import mongoose from "mongoose";

const UnavailableTimeSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true }

}); 

const scheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  unavailableTimes: [UnavailableTimeSchema]

}, { timestamps: true });

const Schedule = mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);

export default Schedule;
