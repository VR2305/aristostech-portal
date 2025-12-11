import { connectToDB } from "@/lib/db"; // <--- FIXED: Added curly braces
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1. Log that the request started
    console.log("--- Starting Registration Process ---");

    const body = await req.json();
    const { name, email, password, mobile, dob, role } = body;

    console.log("Received Data:", { name, email, role }); // Log received data (password hidden)

    // 2. Validate Fields
    if (!name || !email || !password || !mobile || !dob) {
      console.log("❌ Validation Error: Missing fields");
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    // 3. Connect to Database
    console.log("Attempting to connect to MongoDB...");
    await connectToDB(); // <--- FIXED: Function call updated
    console.log("✅ MongoDB Connected");

    // 4. Check for Existing User
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ User already exists:", email);
      return NextResponse.json({ message: "Email already exists." }, { status: 400 });
    }

    // 5. Hash Password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Create User
    console.log("Creating user document...");
    await User.create({
      name,
      email,
      password: hashedPassword,
      mobile,
      dob,
      role: role || "employee",
    });

    console.log("✅ User Registered Successfully");
    return NextResponse.json({ message: "User registered." }, { status: 201 });

  } catch (error) {
    // --- CRITICAL DEBUGGING LINE ---
    console.error("❌ CRITICAL SERVER ERROR:", error); 
    
    // Return the specific error message to the frontend so you can see it
    return NextResponse.json({ 
      message: "Internal Server Error", 
      error: error.message 
    }, { status: 500 });
  }
}