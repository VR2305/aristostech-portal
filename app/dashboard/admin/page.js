"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  Briefcase, Plus, LogOut, Trash2, RefreshCcw, Calendar, 
  ClipboardList, Download, MessageSquare, X, Clock, Tag,
  FileText, CheckSquare, Filter, AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  
  // Data State
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]); 
  
  // UI State
  const [viewMode, setViewMode] = useState("calendar"); 
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);

  // Report Filter State
  const [reportFilter, setReportFilter] = useState("Day"); 

  // Forms
  const [newTask, setNewTask] = useState({ 
    title: "", description: "", priority: "Medium", dueDate: "", 
    assignedTo: "", tags: "", isRecurring: false, recurringFrequency: "None" 
  });
  const [newComment, setNewComment] = useState("");

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchTasks(), fetchReports()]);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { cache: 'no-store' });
      const data = await res.json();
      setUsers(data.filter(u => u.role === 'employee'));
    } catch (error) { console.error("Error fetching users"); }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks", { cache: 'no-store' });
      setTasks(await res.json());
    } catch (error) { console.error("Error fetching tasks"); }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports", { cache: 'no-store' });
      setReports(await res.json());
    } catch (error) { console.error("Error fetching reports"); }
  };

  // --- HELPER: Format Date (Removes T00:00:00.000Z) ---
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Fallback if invalid
    return date.toLocaleDateString(); // Returns clean format like "12/06/2023"
  };

  // --- LOGIC: Filter Reports ---
  const getFilteredReports = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return reports.filter(r => {
        const rDate = new Date(r.date);
        
        if (reportFilter === "Day") {
            // Compare dates only
            return rDate.toDateString() === now.toDateString();
        } 
        else if (reportFilter === "Week") {
            const firstDayOfWeek = new Date(startOfToday);
            firstDayOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
            return rDate >= firstDayOfWeek && rDate <= now;
        } 
        else if (reportFilter === "Month") {
            return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
        } 
        else if (reportFilter === "Year") {
            return rDate.getFullYear() === now.getFullYear();
        }
        return true;
    });
  };

  // --- HANDLERS ---
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const employee = users.find(u => u.email === newTask.assignedTo);
    
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newTask,
        assignedToName: employee?.name,
        tags: newTask.tags.split(',').map(t => t.trim()).filter(t => t),
        status: "To-Do",
        createdBy: session?.user?.email
      }),
    });
    
    alert("Task Created!"); 
    setShowTaskModal(false); 
    setNewTask({ title: "", description: "", priority: "Medium", dueDate: "", assignedTo: "", tags: "", isRecurring: false, recurringFrequency: "None" });
    fetchTasks();
  };

  const handleDeleteTask = async (id) => {
    if(!confirm("Delete task?")) return;
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    fetchTasks();
    if (showDetailModal?._id === id) setShowDetailModal(null);
  };

  const handleAddComment = async (taskId) => {
    if(!newComment.trim()) return;
    
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: taskId, 
        comment: { user: session.user.name, text: newComment } 
      }),
    });
    
    setNewComment("");
    fetchTasks(); 
    setShowDetailModal(prev => ({
        ...prev,
        comments: [...(prev.comments || []), { user: session.user.name, text: newComment, createdAt: new Date() }]
    }));
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Employee", "Work Title", "Status"];
    const rows = reports.map(r => [formatDate(r.date), r.userName, r.workTitle, r.status]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reports_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case "High": case "Critical": return "bg-red-100 text-red-700 border-red-200";
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // --- CALENDAR RENDERER ---
  const renderCalendar = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="grid grid-cols-7 gap-2 bg-white p-4 rounded-xl shadow-sm border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase py-2">{d}</div>
            ))}
            {days.map(day => {
                // Construct date string for comparison
                const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
                const currentDay = String(day).padStart(2, '0');
                const dateStr = `${today.getFullYear()}-${currentMonth}-${currentDay}`;
                
                // Flexible Comparison: Matches "YYYY-MM-DD" or "YYYY-MM-DDT..."
                const dayTasks = tasks.filter(t => t.dueDate?.startsWith(dateStr));
                
                const isToday = day === today.getDate();

                return (
                    <div key={day} className={`min-h-[120px] border rounded-lg p-2 transition relative flex flex-col gap-1 overflow-hidden ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        {/* Calendar Date Number */}
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${isToday ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
                                {day}
                            </span>
                        </div>

                        {/* Tasks in Calendar */}
                        {dayTasks.map(t => (
                            <div key={t._id} 
                                 className="text-xs bg-white text-gray-800 p-2 rounded border border-gray-200 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all flex flex-col gap-0.5" 
                                 onClick={()=>setShowDetailModal({...t, itemType: 'task'})}>
                                <div className="flex items-center gap-1 font-bold text-blue-700 truncate">
                                    <CheckSquare size={10} className="flex-shrink-0" />
                                    <span>{t.title}</span>
                                </div>
                                {/* CLEAN DUE DATE LABEL IN CALENDAR */}
                                <div className="text-[10px] text-gray-500 font-medium">
                                    Due: {formatDate(t.dueDate)}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><Briefcase size={24}/></div>
          <div><h1 className="text-xl font-bold">Admin Hub</h1><p className="text-xs text-gray-500">Project Management</p></div>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="flex gap-2 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"><LogOut size={18} /> Logout</button>
      </nav>

      {/* Toolbar */}
      <div className="flex justify-between mb-6 flex-wrap gap-4">
         <div className="flex gap-2">
            <button onClick={() => setViewMode("list")} className={`p-2 rounded border ${viewMode==='list'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 border-gray-300'}`} title="List View"><ClipboardList size={20}/></button>
            <button onClick={() => setViewMode("calendar")} className={`p-2 rounded border ${viewMode==='calendar'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 border-gray-300'}`} title="Calendar View"><Calendar size={20}/></button>
            <button onClick={refreshData} className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600" title="Refresh"><RefreshCcw size={20}/></button>
         </div>
         <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold"><Plus size={16}/> New Task</button>
      </div>

      {/* --- SECTION 1: TASKS --- */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-blue-600"/> Scheduled Tasks</h2>
        
        {viewMode === 'calendar' ? renderCalendar() : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map(task => (
                    <div key={task._id} className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md cursor-pointer transition-all" onClick={()=>setShowDetailModal({...task, itemType: 'task'})}>
                        <div className="flex justify-between mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                            
                            {/* --- LIST VIEW CLEAN DUE DATE --- */}
                            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                <Clock size={12} />
                                <span className="text-xs font-bold uppercase">Due Date: {formatDate(task.dueDate)}</span>
                            </div>
                        </div>
                        
                        <h3 className="font-bold text-gray-800 text-lg mb-1">{task.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-3 line-clamp-1">Assigned to: <span className="font-medium text-blue-600">{task.assignedToName}</span></p>
                        
                        <div className="mt-auto flex justify-between items-center border-t pt-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${task.status==='Completed'?'bg-green-50 text-green-600':task.status==='In Progress'?'bg-blue-50 text-blue-600':'bg-gray-100 text-gray-600'}`}>{task.status}</span>
                            <button onClick={(e)=>{e.stopPropagation(); handleDeleteTask(task._id)}} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- SECTION 2: REPORTS LIST --- */}
      <div className="border-t pt-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText size={20} className="text-green-600"/> Employee Work Reports</h2>
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white border px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-bold text-gray-700"><Download size={16}/> Export CSV</button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
            <div className="flex gap-2 items-center mb-4">
                <Filter size={16} className="text-gray-400" />
                <span className="text-sm font-bold text-gray-500 uppercase">Filter By:</span>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['Day', 'Week', 'Month', 'Year'].map(filter => (
                        <button 
                            key={filter}
                            onClick={() => setReportFilter(filter)}
                            className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${reportFilter === filter ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports List */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 font-bold">Date</th>
                            <th className="p-3 font-bold">Employee</th>
                            <th className="p-3 font-bold">Work Title</th>
                            <th className="p-3 font-bold">Status</th>
                            <th className="p-3 font-bold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredReports().map((r, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50 transition cursor-pointer" onClick={()=>setShowDetailModal({...r, itemType: 'report'})}>
                                <td className="p-3 font-medium text-gray-900">{formatDate(r.date)}</td>
                                <td className="p-3 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                        {r.userName.charAt(0)}
                                    </div>
                                    {r.userName}
                                </td>
                                <td className="p-3 truncate max-w-[200px]">{r.workTitle}</td>
                                <td className="p-3">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${r.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <button className="text-blue-600 hover:underline text-xs">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {getFilteredReports().length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">No reports found for this period.</div>
                )}
            </div>
        </div>
      </div>

      {/* --- DETAILS MODAL --- */}
      {showDetailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="flex justify-between mb-4">
                      <div>
                          {showDetailModal.itemType === 'report' ? (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold uppercase">Daily Report</span>
                                    <span className="text-gray-400 text-xs">{formatDate(showDetailModal.date)}</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">{showDetailModal.userName}</h2>
                              </>
                          ) : (
                              <>
                                <h2 className="text-xl font-bold text-gray-800">{showDetailModal.title}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                        <Clock size={12}/> Due Date: {formatDate(showDetailModal.dueDate)}
                                    </span>
                                    <span className="text-xs text-gray-500">• Priority: {showDetailModal.priority}</span>
                                </div>
                              </>
                          )}
                      </div>
                      <button onClick={()=>setShowDetailModal(null)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full h-fit"><X size={20}/></button>
                  </div>
                  
                  {showDetailModal.itemType === 'report' ? (
                      <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-lg border">
                              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Work Title</label>
                              <p className="font-semibold text-gray-800">{showDetailModal.workTitle}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg border">
                              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Status</label>
                              <p className={`font-semibold ${showDetailModal.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}`}>{showDetailModal.status}</p>
                          </div>
                      </div>
                  ) : (
                      <>
                        <div className="bg-gray-50 p-4 rounded-lg border mb-4 overflow-y-auto flex-shrink-0 max-h-32">
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{showDetailModal.description || "No description provided."}</p>
                        </div>
                        <div className="flex-1 bg-white border rounded-lg mb-4 overflow-y-auto p-3 space-y-3 min-h-[150px]">
                            {showDetailModal.comments?.map((c, i) => (
                                <div key={i} className="text-sm">
                                    <div className="flex justify-between items-baseline"><span className="font-bold text-xs text-blue-600">{c.user}</span><span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString()}</span></div>
                                    <div className="bg-gray-50 p-2 rounded-lg text-gray-700 mt-1 border border-gray-100">{c.text}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-auto">
                            <input className="flex-1 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type a comment..." value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment(showDetailModal._id)}/>
                            <button onClick={()=>handleAddComment(showDetailModal._id)} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><MessageSquare size={18}/></button>
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}

      {/* --- NEW TASK MODAL --- */}
      {showTaskModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <form onSubmit={handleCreateTask} className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="font-bold text-xl text-gray-800">Create New Task</h2>
                    <button type="button" onClick={()=>setShowTaskModal(false)}><X className="text-gray-400 hover:text-red-500"/></button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Task Title</label>
                        <input placeholder="Task Title" className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500" required onChange={e=>setNewTask({...newTask, title: e.target.value})} />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Assign To</label>
                        <select className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white" onChange={e=>setNewTask({...newTask, assignedTo: e.target.value})} required>
                            <option value="">Select Employee</option>
                            {users.map(u => <option key={u._id} value={u.email}>{u.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Priority</label>
                        <select className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white" onChange={e=>setNewTask({...newTask, priority: e.target.value})}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Due Date</label>
                        <input type="date" className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500" required onChange={e=>setNewTask({...newTask, dueDate: e.target.value})} />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Recurring?</label>
                         <select className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                             onChange={e => setNewTask({...newTask, recurringFrequency: e.target.value, isRecurring: e.target.value !== 'None'})}>
                             <option value="None">No (One-time)</option>
                             <option value="Daily">Daily</option>
                             <option value="Weekly">Weekly</option>
                             <option value="Monthly">Monthly</option>
                         </select>
                     </div>
                     <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                        <textarea rows="3" className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500" onChange={e=>setNewTask({...newTask, description: e.target.value})} />
                     </div>
                     <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tags (comma separated)</label>
                        <input placeholder="frontend, bug, ui" className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500" onChange={e=>setNewTask({...newTask, tags: e.target.value})} />
                     </div>
                 </div>

                 <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
                     <button type="button" onClick={()=>setShowTaskModal(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                     <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">Create Task</button>
                 </div>
             </form>
          </div>
      )}
    </div>
  );
}