"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { FileText, CheckCircle, LogOut, ClipboardList, RefreshCcw, Clock } from "lucide-react";

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [myReports, setMyReports] = useState([]);
  const [taskData, setTaskData] = useState(null);
  
  // Status Update State for the Assigned Task
  const [currentStatus, setCurrentStatus] = useState("Pending");

  // Daily Report Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], 
    attendance: "Present",
    workTitle: "",
    taskType: "Development",
    status: "Pending",
  });

  useEffect(() => {
    if (session?.user?.email) {
      fetchMyTask();
      fetchReports();
    }
  }, [session]);

  const fetchMyTask = async () => {
    try {
      const res = await fetch(`/api/users?email=${session.user.email}`, { cache: 'no-store' });
      const data = await res.json();
      setTaskData(data);
      if(data.taskStatus) setCurrentStatus(data.taskStatus);
      
      // Optional: Auto-fill report title with assigned task title if available
      if (data.taskTitle && data.taskTitle !== "Unassigned") {
         setFormData(prev => ({ ...prev, workTitle: data.taskTitle }));
      }
    } catch (error) { console.error("Error fetching task"); }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/reports?userId=${session.user.email}`, { cache: 'no-store' });
      const data = await res.json();
      setMyReports(data);
    } catch (error) { console.error("Error fetching reports"); }
  };

  // 1. Update ONLY the status of the assigned task (Connects to Users API)
  const handleUpdateStatus = async () => {
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: taskData._id, 
        taskStatus: currentStatus 
      }),
    });
    if (res.ok) {
      alert("✅ Task Status Updated!");
      fetchMyTask(); // Refresh to see changes
    }
  };

  // 2. Submit a Daily Report (Connects to Reports API)
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        userId: session?.user?.email,
        userName: session?.user?.name
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Report Logged Successfully!");
      fetchReports(); 
    } else {
      alert("❌ Error: " + data.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Hello, {session?.user?.name}</h1>
          <p className="text-sm text-gray-500">Employee Panel</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="flex gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg font-medium transition-colors"><LogOut size={18}/> Logout</button>
      </nav>

      {/* --- SECTION A: CURRENT ASSIGNMENT CARD --- */}
      <div className="max-w-3xl mx-auto mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2"><ClipboardList/> Current Assignment</h2>
            <button onClick={fetchMyTask} className="hover:bg-blue-500 p-1 rounded transition-colors"><RefreshCcw size={18}/></button>
        </div>
        
        <div className="p-6">
            {taskData?.taskTitle && taskData.taskTitle !== "Unassigned" ? (
                <>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">{taskData.taskTitle}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <Clock size={14}/> <span>Time Period: <span className="font-bold text-blue-600">{taskData.taskTimePeriod}</span></span>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            currentStatus === 'Completed' ? 'bg-green-100 text-green-700' : 
                            currentStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {currentStatus}
                        </span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Description</h4>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{taskData.taskDescription}</p>
                    </div>

                    {/* STATUS UPDATER */}
                    <div className="flex items-center gap-4 border-t pt-4 bg-gray-50/50 p-3 rounded-lg">
                        <label className="text-sm font-bold text-gray-700">Update Task Status:</label>
                        <select 
                            className="p-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
                            value={currentStatus}
                            onChange={(e) => setCurrentStatus(e.target.value)}
                        >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                        <button onClick={handleUpdateStatus} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all">Save Status</button>
                    </div>
                </>
            ) : (
                <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                    <ClipboardList size={32} className="opacity-20"/>
                    <p>No active tasks assigned yet.</p>
                </div>
            )}
        </div>
      </div>

      {/* --- SECTION B: DAILY REPORT FORM --- */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-emerald-600"/> Log Daily Activity
          </h2>
        </div>
        
        <form onSubmit={handleSubmitReport} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
              <input 
                type="date" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Attendance</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" 
                onChange={(e) => setFormData({...formData, attendance: e.target.value})}
              >
                <option value="Present">Present</option>
                <option value="Half Day">Half Day</option>
                <option value="Remote">Remote</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Work Title</label>
            <input 
              type="text" 
              placeholder="Brief summary of work..." 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none" 
              value={formData.workTitle} 
              onChange={(e) => setFormData({...formData, workTitle: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Type</label>
                <select 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" 
                    onChange={(e) => setFormData({...formData, taskType: e.target.value})}
                >
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Testing">Testing</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Learning">Learning</option>
                </select>
            </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                <select 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                </select>
            </div>
          </div>

          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold flex justify-center gap-2 transition-all shadow-md">
            <CheckCircle size={20} /> Submit Daily Log
          </button>
        </form>
      </div>

      {/* --- SECTION C: HISTORY --- */}
      <div className="max-w-3xl mx-auto">
        <h3 className="font-bold text-gray-700 mb-4 px-1">My Report History</h3>
        <div className="space-y-3">
          {myReports.map((report) => (
            <div key={report._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow">
               <div>
                 <p className="font-bold text-gray-800">{report.workTitle}</p>
                 <p className="text-xs text-gray-500 flex gap-2 mt-1">
                    <span>📅 {report.date}</span>
                    <span className="font-medium text-emerald-600">• {report.taskType}</span>
                 </p>
               </div>
               <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                 report.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                 report.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                 'bg-yellow-50 text-yellow-700 border-yellow-200'
               }`}>
                 {report.status}
               </span>
            </div>
          ))}
          {myReports.length === 0 && (
            <div className="text-center p-8 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-400">No updates submitted yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}