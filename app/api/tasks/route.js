import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Task from "@/models/Task";

// GET: Fetch all tasks or filter by email
export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    let tasks;
    if (email) {
      // Find tasks assigned to a specific user (Employee View)
      tasks = await Task.find({ assignedTo: email }).sort({ createdAt: -1 });
    } else {
      // Find ALL tasks (Admin View)
      tasks = await Task.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("API GET ERROR:", error);
    return NextResponse.json({ message: "Error fetching tasks", error: error.message }, { status: 500 });
  }
}

// POST: Create a new task
export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    console.log("API: Creating new task:", body);
    
    const newTask = await Task.create(body);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("API POST ERROR:", error);
    return NextResponse.json({ message: "Error creating task", error: error.message }, { status: 500 });
  }
}

// PUT: Update Task details OR Add a Comment
export async function PUT(req) {
    try {
        await connectToDB();
        const body = await req.json();
        
        // Destructure to separate ID, Action Type, and Data
        const { id, type, ...updateData } = body; 

        if (!id) {
            return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
        }

        let updatedTask;

        if (type === 'comment') {
            // ACTION: Add a new comment to the task
            // We use $push to add the comment object to the 'comments' array
            updatedTask = await Task.findByIdAndUpdate(
                id, 
                { $push: { comments: updateData.comment } }, 
                { new: true }
            );
        } else {
            // ACTION: Update task fields (Status, Title, Priority, etc.)
            // updateData contains fields like { status: "Completed" } or { title: "New Title" }
            updatedTask = await Task.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true }
            );
        }

        if (!updatedTask) {
             return NextResponse.json({ message: "Task not found" }, { status: 404 });
        }

        return NextResponse.json(updatedTask, { status: 200 });
    } catch (error) {
        console.error("API PUT ERROR:", error);
        return NextResponse.json({ message: "Error updating task", error: error.message }, { status: 500 });
    }
}