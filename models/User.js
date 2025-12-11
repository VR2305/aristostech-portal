import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "Employee" },
  // ADD THIS FIELD:
  phone: { type: String, default: "Not Provided" }, 
  dept: { type: String },
  status: { type: String, default: "Active" },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);