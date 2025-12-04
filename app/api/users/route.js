import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

// 1. GET USERS
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (email) {
    const user = await User.findOne({ email });
    return NextResponse.json(user);
  } else {
    const users = await User.find().sort({ createdAt: -1 });
    return NextResponse.json(users);
  }
}

// 2. UPDATE USER (Save Task Details)
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, taskTitle, taskDescription, taskTimePeriod, taskStatus, name, mobile } = body;
    
    await connectDB();

    // Create dynamic update object
    const updateData = {};
    if (taskTitle) updateData.taskTitle = taskTitle;
    if (taskDescription) updateData.taskDescription = taskDescription;
    if (taskTimePeriod) updateData.taskTimePeriod = taskTimePeriod;
    if (taskStatus) updateData.taskStatus = taskStatus;
    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;

    await User.findByIdAndUpdate(id, updateData);
    
    return NextResponse.json({ message: "Updated Successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// 3. DELETE USER
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await connectDB();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "User Deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting user" }, { status: 500 });
  }
}