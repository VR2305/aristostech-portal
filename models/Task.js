import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: "To-Do" },
    priority: { type: String, default: "Medium" },
    dueDate: { type: String }, // Storing as YYYY-MM-DD string for easier comparison
    assignedTo: { type: String, required: true },
    assignedToName: { type: String },
    tags: [String],
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String },
    createdBy: { type: String },
    
    // --- NEW FIELDS ---
    comments: [{
      user: String, // "Alice Admin"
      text: String,
      createdAt: { type: Date, default: Date.now }
    }],
    attachments: [{ name: String, url: String }] // Storing simulated file links
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model("Task", taskSchema);