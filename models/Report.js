import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // The email of the employee
    userName: { type: String, required: true }, // The name of the employee
    date: { type: String, required: true },
    attendance: { type: String, required: true },
    workTitle: { type: String, required: true },
    taskType: { type: String, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// This ensures we don't compile the model twice in Next.js (hot reloading fix)
export default mongoose.models.Report || mongoose.model("Report", reportSchema);