"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  FileText, LogOut, ClipboardList, MessageSquare, 
  Paperclip, X, Clock, RefreshCcw, CheckCircle2 
} from "lucide-react";

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [myReports, setMyReports] = useState([]);
  
  // Daily Report Form State
  const [reportData, setReportData] = useState({ 
    workTitle: "", 
    status: "Pending",
    date: new Date().toISOString().split('T')[0],
    attendance: "Present",
    taskType: "Development"
  });

  useEffect(() => {
    if (session?.user?.email) {
      fetchTasks();
      fetchMyReports();
    }
  }, [session]);

  // --- HELPER: Fixes the raw date issue shown in your image ---
  const formatDate = (dateString) => {
    if (!dateString) return "No Date";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  };

  // 1. Fetch Tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?email=${session.user.email}`, { cache: 'no-store' });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) { console.error("Error fetching tasks"); }
  };

  // 2. Fetch Reports
  const fetchMyReports = async () => {
    try {
      const res = await fetch(`/api/reports?userId=${session.user.email}`, { cache: 'no-store' });
      const data = await res.json();
      setMyReports(Array.isArray(data) ? data : []);
    } catch (error) { console.error("Error fetching reports"); }
  };

  // 3. Add Comment
  const handleAddComment = async () => {
    if(!newComment.trim()) return;
    await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedTask._id, 
          comment: { user: session.user.name, text: newComment } 
        })
    });
    setNewComment("");
    
    // Update local modal state
    setSelectedTask(prev => ({
      ...prev,
      comments: [...(prev.comments || []), { user: session.user.name, text: newComment, createdAt: new Date() }]
    }));
    fetchTasks(); // Refresh background list
  };

  // 4. NEW: Handle Status Update by Employee
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTask) return;

    // Optimistic UI Update (Updates immediately for the user)
    const updatedTask = { ...selectedTask, status: newStatus };
    setSelectedTask(updatedTask);
    
    // Update the main list in the background
    setTasks(prev => prev.map(t => t._id === selectedTask._id ? updatedTask : t));

    // Send update to API
    try {
        await fetch("/api/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              id: selectedTask._id, 
              status: newStatus 
            })
        });
    } catch (error) {
        console.error("Failed to update status");
        alert("Failed to save status update.");
    }
  };

  // 5. Submit Daily Report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...reportData,
        userId: session.user.email,
        userName: session.user.name
      }),
    });

    if(res.ok) {
      alert("✅ Report Logged Successfully!");
      setReportData({ ...reportData, workTitle: "" });
      fetchMyReports();
    } else {
      const error = await res.json();
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Workspace</h1>
          <p className="text-xs text-gray-500">Employee Portal</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="flex gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg font-medium transition-colors"><LogOut size={18}/> Logout</button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN: TASK LIST */}
          <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex gap-2 text-gray-800"><ClipboardList className="text-blue-600"/> Assigned Tasks</h2>
                <button onClick={fetchTasks} className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50"><RefreshCcw size={16}/></button>
              </div>
              
              <div className="space-y-4">
                  {tasks.map(task => (
                      <div key={task._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 cursor-pointer transition-all group" onClick={()=>setSelectedTask(task)}>
                          <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-gray-800 text-lg">{task.title}</h3>
                              <span className={`text-xs px-2 py-1 rounded font-bold ${
                                task.priority==='High' || task.priority==='Critical' ? 'bg-red-100 text-red-700' : 
                                task.priority==='Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                              }`}>{task.priority}</span>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description || "No description."}</p>
                          
                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            {/* Uses formatDate helper here */}
                            <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12}/> Due: {formatDate(task.dueDate)}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                                <MessageSquare size={14}/> {task.comments?.length || 0} Comments
                            </div>
                          </div>
                          
                          {/* Visual Indicator of Status in List View */}
                          <div className="mt-2">
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                             }`}>
                                {task.status}
                             </span>
                          </div>
                      </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                      <p className="text-gray-400">No tasks assigned yet.</p>
                    </div>
                  )}
              </div>
          </div>

          {/* RIGHT COLUMN: DAILY REPORTING (Unchanged) */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold text-lg mb-6 flex gap-2 text-gray-800"><FileText className="text-emerald-600"/> Log Daily Activity</h2>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                        <input type="date" className="w-full p-2 border rounded-lg text-sm mt-1 outline-none focus:ring-2 focus:ring-emerald-500" 
                          value={reportData.date} onChange={e=>setReportData({...reportData, date: e.target.value})} required />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Attendance</label>
                        <select className="w-full p-2 border rounded-lg text-sm mt-1 outline-none focus:ring-2 focus:ring-emerald-500 bg-white" 
                          onChange={e=>setReportData({...reportData, attendance: e.target.value})}>
                            <option>Present</option><option>Half Day</option><option>Remote</option><option>On Leave</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Work Title</label>
                      <input className="w-full p-3 border rounded-lg text-sm mt-1 outline-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="What did you work on today?" value={reportData.workTitle} onChange={e=>setReportData({...reportData, workTitle: e.target.value})} required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Task Type</label>
                          <select className="w-full p-2 border rounded-lg text-sm mt-1 outline-none focus:ring-2 focus:ring-emerald-500 bg-white" 
                            onChange={e=>setReportData({...reportData, taskType: e.target.value})}>
                              <option>Development</option><option>Design</option><option>Testing</option><option>Meeting</option><option>Learning</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                          <select className="w-full p-2 border rounded-lg text-sm mt-1 outline-none focus:ring-2 focus:ring-emerald-500 bg-white" 
                            onChange={e=>setReportData({...reportData, status: e.target.value})}>
                              <option>Pending</option><option>Completed</option><option>In Progress</option>
                          </select>
                        </div>
                    </div>
                    
                    <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">Submit Daily Log</button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-h-80 overflow-y-auto">
               <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase">Recent Logs</h3>
               <div className="space-y-3">
                 {myReports.map((report) => (
                   <div key={report._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{report.workTitle}</p>
                        <p className="text-xs text-gray-500">{formatDate(report.date)} • {report.taskType}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-white border px-2 py-1 rounded text-gray-600">{report.status}</span>
                   </div>
                 ))}
                 {myReports.length === 0 && <p className="text-center text-xs text-gray-400">No logs found.</p>}
               </div>
            </div>
          </div>
      </div>

      {/* --- TASK DETAIL MODAL --- */}
      {selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
                  
                  {/* HEADER: Title & Status Update */}
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 mr-4">
                        <h2 className="text-xl font-bold text-gray-800 leading-tight">{selectedTask.title}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            {/* --- NEW: STATUS DROPDOWN --- */}
                            <select 
                                value={selectedTask.status} 
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                                    selectedTask.status==='Completed'?'bg-green-100 text-green-700 border-green-200':
                                    selectedTask.status==='In Progress'?'bg-blue-100 text-blue-700 border-blue-200':
                                    'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                            >
                                <option value="To-Do">To-Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Click to update</span>
                        </div>
                      </div>
                      <button onClick={()=>setSelectedTask(null)} className="text-gray-400 hover:text-gray-600 h-fit p-1 bg-gray-50 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6 flex-shrink-0 overflow-y-auto max-h-32">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Description</h4>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedTask.description || "No description provided."}</p>
                  </div>
                  
                  <div className="mb-4">
                      <label className="flex items-center gap-2 text-blue-600 cursor-pointer hover:underline text-sm font-bold transition-colors">
                          <Paperclip size={16}/> Attach File (Simulated)
                      </label>
                  </div>

                  <div className="flex items-center gap-2 mb-3 border-t pt-4">
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><MessageSquare size={16}/> Discussion</h3>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 bg-white border rounded-lg mb-4 overflow-y-auto p-3 space-y-3 min-h-[150px]">
                      {selectedTask.comments?.map((c, i) => (
                          <div key={i} className={`text-sm flex flex-col ${c.user === session.user.name ? 'items-end' : 'items-start'}`}>
                              <span className="text-[10px] text-gray-400 mb-1">{c.user} • {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              <div className={`px-3 py-2 rounded-lg max-w-[80%] ${c.user === session.user.name ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                  {c.text}
                              </div>
                          </div>
                      ))}
                      {!selectedTask.comments?.length && <p className="text-xs text-center text-gray-400 py-4">No comments yet. Start the conversation!</p>}
                  </div>
                  
                  <div className="flex gap-2 mt-auto">
                      <input 
                        className="flex-1 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Type a message..." 
                        value={newComment} 
                        onChange={e=>setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} 
                      />
                      <button onClick={handleAddComment} className="bg-blue-600 text-white px-4 rounded-lg font-bold hover:bg-blue-700 transition-colors">Send</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}