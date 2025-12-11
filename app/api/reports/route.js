import { connectToDB } from "@/lib/db"; // <--- FIXED: Added curly braces
import Report from "@/models/Report";
import { NextResponse } from "next/server";

// 1. SAVE REPORT
export async function POST(req) {
  try {
    const { userId, userName, date, attendance, workTitle, taskType, status } = await req.json();
    
    await connectToDB(); // <--- FIXED: Updated function name

    const existing = await Report.findOne({ userId, date });
    if (existing) {
      return NextResponse.json({ message: "Report already submitted for this date." }, { status: 400 });
    }

    await Report.create({ userId, userName, date, attendance, workTitle, taskType, status });
    return NextResponse.json({ message: "Report Saved" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error saving report" }, { status: 500 });
  }
}

// 2. GET REPORTS
export async function GET(req) {
  try {
    await connectToDB(); // <--- FIXED: Updated function name
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let reports;
    if (userId) {
      reports = await Report.find({ userId }).sort({ date: -1 });
    } else {
      reports = await Report.find().sort({ date: -1 });
    }

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching reports" }, { status: 500 });
  }
}

// 3. DELETE REPORT (New Feature)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    await connectToDB(); // <--- FIXED: Updated function name
    
    await Report.findByIdAndDelete(id);
    
    return NextResponse.json({ message: "Report Deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting report" }, { status: 500 });
  }
}