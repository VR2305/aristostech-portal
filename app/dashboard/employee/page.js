"use client";
import { useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  CheckSquare, Users, Clock, Bell, User, LogOut as SignOutIcon, Play, Pause, 
  Menu, Briefcase, FileText, Home, Award, PenTool,
  Settings, ChevronDown, Check, Eye, Plus, Search, Calendar,
  BarChart2, X, Filter, AlertCircle, Shield, Mail, MessageSquare, HelpCircle, Flag,
  Layout
} from "lucide-react";

export default function EmployeeDashboard() {
  const { data: session } = useSession();

  // ================= STATE & DATA =================
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "Loading...",
    phone: "Loading...", 
    role: "VR", 
    department: "Design",
    manager: "Dinesh", 
  });

  // --- DATA STORES (ALL INITIALIZED EMPTY) ---
  const [myTasks, setMyTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]); 
  const [teamMembers, setTeamMembers] = useState([]); 
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]); 
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null); 

  // Attendance State
  const [attendance, setAttendance] = useState({
    status: "Absent",
    checkIn: null,
    checkOut: null,
    totalSeconds: 0,
    history: [] 
  });

  // UI States
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState("Ongoing"); 
  const [selectedTask, setSelectedTask] = useState(null); 
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeRequestTask, setActiveRequestTask] = useState(null); 

  // Forms
  const [leaveForm, setLeaveForm] = useState({ type: "Sick Leave", startDate: "", endDate: "", reason: "" });
  const [requestForm, setRequestForm] = useState({ type: "Doubt", message: "" });

  // ================= FETCH DATA =================
  useEffect(() => {
    if (session?.user?.email) {
        
        // 1. Fetch Tasks
        const fetchTasks = async () => {
            try {
                const res = await fetch(`/api/tasks?email=${session.user.email}`);
                if (res.ok) {
                    const data = await res.json();
                    setMyTasks(data);
                }
            } catch (error) {
                console.error("Error loading tasks", error);
            }
        };

        // 2. Fetch Actual User Data from DB (to get phone number)
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/users');
                if (res.ok) {
                    const allUsers = await res.json();
                    // Find the current logged in user from the list
                    const currentUser = allUsers.find(user => user.email === session.user.email);
                    
                    if (currentUser) {
                        setUserProfile(prev => ({
                            ...prev, 
                            name: currentUser.name, 
                            email: currentUser.email,
                            phone: currentUser.phone || "Not Provided", // Get actual phone from DB
                            department: currentUser.dept || "Design"
                        }));
                    } else {
                        // Fallback to session data if DB fetch fails or user not found
                        setUserProfile(prev => ({
                            ...prev, 
                            name: session.user.name, 
                            email: session.user.email,
                            phone: "Not Provided"
                        }));
                    }
                }
            } catch (error) {
                console.error("Error fetching user profile", error);
            }
        };

        fetchTasks();
        fetchUserData();
    }
  }, [session]);

  // ================= LOGIC HANDLERS =================

  // Timer Logic
  useEffect(() => {
    let interval;
    if (attendance.status === 'Present') {
      interval = setInterval(() => {
        setAttendance(prev => ({ ...prev, totalSeconds: prev.totalSeconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [attendance.status]);

  const formatDuration = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleAttendanceToggle = () => {
    if (attendance.status === 'Absent') {
      const now = new Date();
      setAttendance(prev => ({ ...prev, status: 'Present', checkIn: now }));
      addActivity("Checked in for the day");
    } else {
      setShowCheckoutModal(true);
    }
  };

  const confirmCheckout = async () => {
      const now = new Date();
      const newHistoryItem = {
          date: now.toLocaleDateString(),
          hours: formatDuration(attendance.totalSeconds),
          status: 'Present'
      };
      
      setAttendance(prev => ({ 
          ...prev, 
          status: 'Absent', 
          checkOut: now,
          history: [newHistoryItem, ...prev.history] 
      }));
      
      addActivity("Checked out");
      setShowCheckoutModal(false);
      try {
        await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email, action: 'checkout' })
        });
      } catch (error) { console.error("Checkout failed", error); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setMyTasks(prev => prev.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
    ));
    addActivity(`Updated task status to ${newStatus}`);
    try {
        await fetch('/api/tasks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: taskId, status: newStatus })
        });
    } catch (error) { console.error("Failed to update status"); }
  };

  const openRequestModal = (task) => {
      setActiveRequestTask(task);
      setShowRequestModal(true);
  };

  const submitRequest = (e) => {
      e.preventDefault();
      addActivity(`Sent ${requestForm.type} request to Admin`);
      alert(`Request sent to Admin successfully!`);
      setShowRequestModal(false);
      setRequestForm({ type: "Doubt", message: "" });
  };

  const handleSubmitLeave = (e) => {
    e.preventDefault();
    const newLeave = { ...leaveForm, id: Date.now(), status: "Pending" };
    setLeaveRequests([newLeave, ...leaveRequests]);
    setShowLeaveModal(false);
    addActivity(`Requested ${leaveForm.type}`);
    setLeaveForm({ type: "Sick Leave", startDate: "", endDate: "", reason: "" });
  };

  // --- UPDATED SIGNOUT HANDLER ---
  const handleSignOut = () => {
      // Redirects to the root app page (login/landing)
      signOut({ callbackUrl: '/' }); 
  };

  const addActivity = (text) => {
    setActivities(prev => [{ id: Date.now(), text, time: "Just now" }, ...prev]);
  };

  const filteredTasks = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);

    return myTasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      const isOverdue = dueDate < todayDate && t.status !== "Completed";

      if (taskFilter === "Ongoing") return t.status !== "Completed" && !isOverdue;
      if (taskFilter === "Completed") return t.status === "Completed";
      if (taskFilter === "Due Today") {
          return dueDate.getTime() === todayDate.getTime() && t.status !== "Completed";
      }
      if (taskFilter === "Overdue") return isOverdue; 
      return true;
    });
  }, [myTasks, taskFilter]);

  const getPriorityColor = (p) => {
      if(p === 'High') return 'bg-red-100 text-red-700 border-red-200';
      if(p === 'Medium') return 'bg-orange-100 text-orange-700 border-orange-200';
      return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  // ================= RENDERERS =================

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-xl font-bold text-gray-800">Dashboard Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div><p className="text-xs text-gray-500 font-bold uppercase">Tasks Due</p><h4 className="text-2xl font-bold text-gray-800 mt-1">{myTasks.filter(t => t.status !== 'Completed').length}</h4></div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><CheckSquare size={20}/></div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div><p className="text-xs text-gray-500 font-bold uppercase">Hours Logged</p><h4 className="text-2xl font-bold text-gray-800 mt-1">{formatDuration(attendance.totalSeconds)}</h4></div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Clock size={20}/></div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div><p className="text-xs text-gray-500 font-bold uppercase">Meetings</p><h4 className="text-2xl font-bold text-gray-800 mt-1">0</h4></div>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={20}/></div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div><p className="text-xs text-gray-500 font-bold uppercase">Status</p><h4 className={`text-xl font-bold mt-1 ${attendance.status==='Present'?'text-emerald-600':'text-gray-500'}`}>{attendance.status}</h4></div>
              <div className={`p-2 rounded-lg ${attendance.status==='Present'?'bg-emerald-100 text-emerald-600':'bg-gray-100'}`}><User size={20}/></div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
           <h4 className="font-bold text-gray-800 mb-4">Quick Actions</h4>
           <div className="grid grid-cols-2 gap-3">
              <button onClick={handleAttendanceToggle} className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-colors ${attendance.status==='Absent' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'}`}>
                  {attendance.status==='Absent' ? <Play size={24}/> : <Pause size={24}/>}
                  {attendance.status==='Absent' ? 'Check In' : 'Check Out'}
              </button>
              <button onClick={() => setShowLeaveModal(true)} className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-bold flex flex-col items-center gap-2">
                  <Calendar size={24}/> Request Leave
              </button>
              <button className="p-4 col-span-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-bold flex flex-col items-center gap-2">
                  <Mail size={24}/> Email Team
              </button>
           </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
           <h4 className="font-bold text-gray-800 mb-4">Recent Activity</h4>
           <div className="space-y-4">
              {activities.length === 0 && <p className="text-sm text-gray-400">No recent activity.</p>}
              {activities.map(act => (
                  <div key={act.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-teal-500 mt-2"></div>
                      <div>
                          <p className="text-sm text-gray-700 font-medium">{act.text}</p>
                          <p className="text-xs text-gray-400">{act.time}</p>
                      </div>
                  </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );

  const renderMyTasks = () => (
    <div className="space-y-6 animate-fade-in relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <h3 className="text-xl font-bold text-gray-800">My Tasks</h3>
             <div className="flex p-1 bg-gray-100 rounded-lg">
                 {["Ongoing", "Due Today", "Overdue", "Completed"].map(filter => (
                     <button 
                        key={filter}
                        onClick={() => setTaskFilter(filter)}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${taskFilter === filter ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'} ${filter === 'Overdue' ? 'text-red-500' : ''}`}
                     >
                         {filter}
                     </button>
                 ))}
             </div>
        </div>

        <div className="space-y-3">
            {filteredTasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <CheckSquare size={40} className="mx-auto text-gray-300 mb-2"/>
                    <p className="text-gray-500">No {taskFilter.toLowerCase()} tasks found.</p>
                </div>
            ) : (
                filteredTasks.map(task => {
                    const isOverdue = new Date(task.dueDate) < new Date().setHours(0,0,0,0) && task.status !== "Completed";
                    return (
                        <div key={task._id} className={`bg-white border p-4 rounded-xl flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-shadow group ${isOverdue ? 'border-red-200 bg-red-50/10' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                                <button onClick={() => setSelectedTask(task)} className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                    <Eye size={18}/>
                                </button>
                                <div>
                                    <h4 className={`font-bold text-gray-800 ${task.status==='Completed'?'line-through text-gray-400':''}`}>{task.title}</h4>
                                    <div className="flex gap-3 mt-1 text-xs items-center">
                                        <span className={`px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                            <Flag size={10}/> {task.priority}
                                        </span>
                                        <span className={`${isOverdue ? 'text-red-600 font-bold' : 'text-gray-400'} flex items-center gap-1`}>
                                            <Calendar size={12}/> 
                                            {isOverdue ? 'Overdue: ' : 'Due: '}{task.dueDate}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto justify-end">
                                <button onClick={() => openRequestModal(task)} title="Ask Doubt / Reassign" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                                    <HelpCircle size={18}/>
                                </button>
                                <div className="relative">
                                    <select value={task.status} onChange={(e) => handleStatusChange(task._id, e.target.value)} className={`appearance-none text-xs font-bold py-2 pl-3 pr-8 rounded-lg cursor-pointer outline-none border focus:ring-2 ${task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
                                        <option>To Do</option><option>In Progress</option><option>Completed</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none"/>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Task Detail Slide-over */}
        {selectedTask && (
            <div className="fixed inset-0 z-50 flex justify-end">
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedTask(null)}></div>
                <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-in-right">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Task Details</h3>
                        <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Title</span>
                            <p className="text-lg font-bold text-gray-800 mt-1">{selectedTask.title}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-xs font-bold text-gray-400 uppercase">Priority</span><p className={`mt-1 font-medium inline-block px-2 py-0.5 rounded text-xs ${getPriorityColor(selectedTask.priority)}`}>{selectedTask.priority}</p></div>
                            <div><span className="text-xs font-bold text-gray-400 uppercase">Due Date</span><p className="mt-1 font-medium">{selectedTask.dueDate}</p></div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Description</span>
                            <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 min-h-[100px]">
                                {selectedTask.description || "No description provided."}
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><MessageSquare size={12}/> Admin Comments</span>
                            <div className="mt-3 space-y-3">
                                {selectedTask.adminComments && selectedTask.adminComments.length > 0 ? (
                                    selectedTask.adminComments.map((comment, idx) => (
                                        <div key={idx} className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                                            <p className="text-xs font-bold text-indigo-700 mb-1">{comment.author} <span className="font-normal text-indigo-400">• {comment.date}</span></p>
                                            <p className="text-sm text-indigo-900">{comment.text}</p>
                                        </div>
                                    ))
                                ) : (<p className="text-sm text-gray-400 italic">No comments from admin yet.</p>)}
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <button className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700">Add Your Note</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderTeamTasks = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Team Board</h3>
            <div className="flex gap-2">
                <button className="p-2 bg-white border rounded-lg text-gray-600 hover:bg-gray-50"><Filter size={18}/></button>
                <button className="p-2 bg-white border rounded-lg text-gray-600 hover:bg-gray-50"><Search size={18}/></button>
            </div>
        </div>
        
        {/* Empty Team Workload */}
        {teamMembers.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                <Users size={40} className="mx-auto text-gray-300 mb-2"/>
                <h4 className="font-bold text-gray-800">No Team Data</h4>
                <p className="text-sm text-gray-500">Team workload and status will appear here.</p>
            </div>
        ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="font-bold text-sm text-gray-600 mb-4">Team Workload Heatmap</h4>
            </div>
        )}

        {/* Empty Columns */}
        {teamTasks.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["To Do", "In Progress", "Completed"].map(status => (
                    <div key={status} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-3 text-sm flex justify-between">{status} <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">0</span></h4>
                        <div className="h-32 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                            No active tasks
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Attendance & Leave</h3>
            <button onClick={() => setShowLeaveModal(true)} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700">
                <Plus size={16}/> Request Leave
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                    <div className="mb-4"><Clock size={48} className={`mx-auto ${attendance.status==='Present'?'text-emerald-500 animate-pulse':'text-gray-400'}`}/></div>
                    <h2 className="text-3xl font-mono font-bold text-gray-800 mb-2">{formatDuration(attendance.totalSeconds)}</h2>
                    <p className="text-sm text-gray-500 mb-6">{new Date().toLocaleDateString()}</p>
                    <button 
                        onClick={handleAttendanceToggle}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${attendance.status==='Absent' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-500 hover:bg-red-600'}`}
                    >
                        {attendance.status === 'Absent' ? <><Play fill="currentColor" size={18}/> CHECK IN</> : <><Pause fill="currentColor" size={18}/> CHECK OUT</>}
                    </button>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-4 text-sm">Today's Timeline</h4>
                    <div className="space-y-4 pl-2 border-l-2 border-gray-100">
                        {attendance.checkIn && (
                            <div className="relative pl-4">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                                <p className="text-xs text-gray-500">{attendance.checkIn.toLocaleTimeString()}</p>
                                <p className="text-sm font-bold text-gray-800">Checked In</p>
                            </div>
                        )}
                        {attendance.checkOut && (
                            <div className="relative pl-4">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                                <p className="text-xs text-gray-500">{attendance.checkOut.toLocaleTimeString()}</p>
                                <p className="text-sm font-bold text-gray-800">Checked Out</p>
                            </div>
                        )}
                        {!attendance.checkIn && <p className="text-xs text-gray-400 pl-4">No activity yet.</p>}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-4 text-sm">My Leave Requests</h4>
                    {leaveRequests.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No leave history.</p>
                    ) : (
                        <div className="space-y-3">
                            {leaveRequests.map(leave => (
                                <div key={leave.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{leave.type}</p>
                                        <p className="text-xs text-gray-500">{leave.startDate} to {leave.endDate}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 font-bold rounded">{leave.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-4 text-sm">Recent Attendance</h4>
                    {attendance.history.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No attendance records found.</p>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-gray-400 uppercase font-bold border-b">
                                <tr><th className="pb-2">Date</th><th className="pb-2">Hours</th><th className="pb-2">Status</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {attendance.history.map((record, i) => (
                                    <tr key={i}>
                                        <td className="py-3">{record.date}</td>
                                        <td className="py-3 font-mono">{record.hours}</td>
                                        <td className="py-3"><span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">{record.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6 animate-fade-in">
        <h3 className="text-xl font-bold text-gray-800">My Performance</h3>
        
        {!performanceMetrics ? (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                <BarChart2 size={40} className="mx-auto text-gray-300 mb-2"/>
                <h4 className="font-bold text-gray-800">No Performance Data</h4>
                <p className="text-sm text-gray-500">Metrics will appear here once you complete tasks.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ... KPI Cards ... */}
            </div>
        )}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Notifications</h3>
            <button className="text-sm font-bold text-teal-600 hover:underline">Mark all as read</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 divide-y">
            {notifications.length === 0 && <div className="p-8 text-center text-gray-400">No new notifications</div>}
            {notifications.map(n => (
                <div key={n.id} className="p-4 flex gap-4 hover:bg-gray-50">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-full h-fit"><Bell size={18}/></div>
                    <div>
                        <h5 className="text-sm font-bold text-gray-800">{n.title}</h5>
                        <p className="text-xs text-gray-600 mt-1">{n.msg}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-gray-800">Settings</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Notifications</h4>
            <div className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Email Alerts for Tasks</span><input type="checkbox" className="toggle" defaultChecked/></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Attendance Reminders</span><input type="checkbox" className="toggle" defaultChecked/></div>
            </div>
        </div>
        {/* Account Security Removed as per previous request */}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-teal-600"></div>
            <div className="relative z-10 w-24 h-24 mx-auto bg-white rounded-full p-1 shadow-lg">
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">{userProfile.name ? userProfile.name[0] : "U"}</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-4">{userProfile.name}</h2>
            <p className="text-gray-500">{userProfile.role}</p>
            <div className="mt-8 grid grid-cols-2 gap-6 text-left">
                <div><span className="text-xs font-bold text-gray-400 uppercase">Email</span><p className="font-medium">{userProfile.email}</p></div>
                <div><span className="text-xs font-bold text-gray-400 uppercase">Phone</span><p className="font-medium">{userProfile.phone}</p></div>
                <div><span className="text-xs font-bold text-gray-400 uppercase">Department</span><p className="font-medium">{userProfile.department}</p></div>
                <div><span className="text-xs font-bold text-gray-400 uppercase">Manager</span><p className="font-medium">{userProfile.manager}</p></div>
            </div>
            {/* UPDATED SIGNOUT BUTTON - REDIRECTS TO APP PAGE (/) */}
            <button onClick={handleSignOut} className="mt-8 w-full py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 flex items-center justify-center gap-2">
                <SignOutIcon size={18}/> Sign Out
            </button>
        </div>
    </div>
  );

  // ================= MAIN LAYOUT =================
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-teal-900 text-white flex flex-col transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
         <div className="p-6 text-xl font-bold border-b border-teal-800 flex items-center gap-2">
             <User className="text-teal-400"/> EmployeePortal
         </div>
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
             {[
                 {id:'overview', l:'Overview', i:Home}, 
                 {id:'myTasks', l:'My Tasks', i:CheckSquare}, 
                 {id:'teamTasks', l:'Team Tasks', i:Users}, 
                 {id:'attendance', l:'Attendance', i:Clock}, 
                 {id:'performance', l:'Performance', i:Award}, 
                 {id:'notifications', l:'Notifications', i:Bell},
                 {id:'settings', l:'Settings', i:Settings}, 
                 {id:'profile', l:'My Profile', i:User}
             ].map(item => (
                 <button key={item.id} onClick={()=>{setActiveTab(item.id); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab===item.id ? 'bg-teal-600 text-white shadow-lg' : 'text-teal-200 hover:bg-teal-800'}`}>
                     <item.i size={20}/> <span>{item.l}</span>
                 </button>
             ))}
         </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
         <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
             <div className="flex items-center gap-4">
                 <button onClick={()=>setSidebarOpen(true)} className="lg:hidden text-gray-500"><Menu/></button>
                 <h2 className="text-lg font-bold text-teal-900 capitalize">{activeTab.replace(/([A-Z])/g, ' $1').trim()}</h2>
             </div>
             <div className="flex items-center gap-4">
                 <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {userProfile.name ? userProfile.name[0] : "U"}
                 </div>
             </div>
         </header>

         <main className="flex-1 overflow-y-auto p-4 lg:p-8">
             {activeTab === 'overview' && renderOverview()}
             {activeTab === 'myTasks' && renderMyTasks()}
             {activeTab === 'teamTasks' && renderTeamTasks()}
             {activeTab === 'attendance' && renderAttendance()}
             {activeTab === 'performance' && renderPerformance()}
             {activeTab === 'notifications' && renderNotifications()}
             {activeTab === 'settings' && renderSettings()}
             {activeTab === 'profile' && renderProfile()}
         </main>
      </div>

      {/* --- CONFIRM CHECKOUT MODAL --- */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><AlertCircle className="text-red-600" size={24} /></div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Checkout</h3>
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to end your work day? This will stop your timer.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-2 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                    <button onClick={confirmCheckout} className="flex-1 py-2 text-white font-bold bg-red-600 hover:bg-red-700 rounded-lg">Check Out</button>
                </div>
            </div>
        </div>
      )}

      {/* --- REQUEST / DOUBT MODAL --- */}
      {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <form onSubmit={submitRequest} className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Send Request to Admin</h3>
                      <button type="button" onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Request Type</label><select className="w-full p-2 border rounded-lg mt-1" value={requestForm.type} onChange={e => setRequestForm({...requestForm, type: e.target.value})}><option value="Doubt">Ask a Doubt</option><option value="Reassign">Request Reassignment</option><option value="Extension">Request Extension</option></select></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Message</label><textarea required className="w-full p-3 border rounded-lg mt-1 h-32 bg-gray-50" placeholder="Describe your doubt or reason..." value={requestForm.message} onChange={e => setRequestForm({...requestForm, message: e.target.value})}></textarea></div>
                  </div>
                  <div className="flex gap-4 mt-6">
                      <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                      <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Send Request</button>
                  </div>
              </form>
          </div>
      )}

      {/* --- LEAVE MODAL --- */}
      {showLeaveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <form onSubmit={handleSubmitLeave} className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Request Leave</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Leave Type</label>
                            <select className="w-full p-2 border rounded-lg mt-1" onChange={e=>setLeaveForm({...leaveForm, type: e.target.value})}>
                                <option>Sick Leave</option><option>Casual Leave</option><option>Privilege Leave</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-500 uppercase">From</label><input type="date" required className="w-full p-2 border rounded-lg mt-1" onChange={e=>setLeaveForm({...leaveForm, startDate: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">To</label><input type="date" required className="w-full p-2 border rounded-lg mt-1" onChange={e=>setLeaveForm({...leaveForm, endDate: e.target.value})}/></div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Reason</label>
                            <textarea className="w-full p-2 border rounded-lg mt-1 h-20" placeholder="Reason for leave..." onChange={e=>setLeaveForm({...leaveForm, reason: e.target.value})}></textarea>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                        <button type="button" onClick={()=>setShowLeaveModal(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Submit</button>
                    </div>
                </form>
            </div>
      )}
    </div>
  );
}