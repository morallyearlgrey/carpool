import mongoose from "mongoose";

const AvailableTimeSchema = new mongoose.Schema({
  day: { type: String, required: true },
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true }

}); 

const scheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  availableTimes: [AvailableTimeSchema]

}, { timestamps: true });

const Schedule = mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);

export default Schedule;
