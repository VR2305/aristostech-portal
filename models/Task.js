import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  assignedTo: { type: String }, // Email
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['To Do', 'In Progress', 'Completed', 'Delayed'], default: 'To Do' },
  dueDate: { type: String },
  description: { type: String }, // Added description field
  comments: [
    {
      text: String,
      author: String, // 'Admin' or User Name
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model("Task", taskSchema);