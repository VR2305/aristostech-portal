import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// GET: Fetch all users
export async function GET(req) {
  try {
    await connectToDB();
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching users" }, { status: 500 });
  }
}

// POST: Add a new user
export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    
    // Check if user exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
        return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // Hash default password
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const newUser = await User.create({ 
        ...body, 
        password: hashedPassword,
        status: "Active"
    });
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error adding user", error: error.message }, { status: 500 });
  }
}

// --- THIS WAS MISSING ---
// PUT: Update an existing user
export async function PUT(req) {
    try {
        await connectToDB();
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        // Find user by ID and update
        const updatedUser = await User.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true } // Return the updated document
        ).select("-password");

        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ message: "Error updating user" }, { status: 500 });
    }
}