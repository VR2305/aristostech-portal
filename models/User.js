import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String, required: true },
    dob: { type: String, required: true },
    role: {
      type: String,
      enum: ["super-admin", "admin", "employee"],
      default: "employee",
    },
    // New Task Fields
    taskTitle: { type: String, default: "Unassigned" },
    taskDescription: { type: String, default: "No details provided" },
    taskTimePeriod: { type: String, default: "N/A" },
    taskStatus: { type: String, default: "Pending" }, // Employee updates this
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);