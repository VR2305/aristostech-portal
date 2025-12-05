import connectDB from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";

// 1. GET TASKS
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    let tasks;
    // If email is provided, get tasks assigned to that specific user (Employee View)
    if (email) {
      tasks = await Task.find({ assignedTo: email }).sort({ dueDate: 1 }); // Earliest deadline first
    } else {
      // If no email, get ALL tasks (Admin View)
      tasks = await Task.find().sort({ createdAt: -1 }); // Newest created first
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ message: "Error fetching tasks" }, { status: 500 });
  }
}

// 2. CREATE NEW TASK
export async function POST(req) {
  try {
    const body = await req.json();
    await connectDB();
    
    const newTask = await Task.create(body);
    
    return NextResponse.json({ message: "Task Created Successfully", task: newTask }, { status: 201 });
  } catch (error) {
    console.error("Task Creation Error:", error);
    return NextResponse.json({ message: "Error creating task" }, { status: 500 });
  }
}

// 3. UPDATE TASK (Status, Details, or Add Comment)
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, comment, ...updateData } = body; // Separate 'comment' from other updates
    
    await connectDB();

    if (comment) {
      // Case A: Adding a chat comment
      // We use $push to append the new comment to the array
      await Task.findByIdAndUpdate(id, { 
        $push: { comments: comment } 
      });
    } else {
      // Case B: Normal update (Status, Priority, etc.)
      await Task.findByIdAndUpdate(id, updateData);
    }

    return NextResponse.json({ message: "Task Updated" });
  } catch (error) {
    console.error("Task Update Error:", error);
    return NextResponse.json({ message: "Error updating task" }, { status: 500 });
  }
}

// 4. DELETE TASK
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    await connectDB();
    await Task.findByIdAndDelete(id);
    
    return NextResponse.json({ message: "Task Deleted" });
  } catch (error) {
    console.error("Task Deletion Error:", error);
    return NextResponse.json({ message: "Error deleting task" }, { status: 500 });
  }
}