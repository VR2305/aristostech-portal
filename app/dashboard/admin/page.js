"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, Users, CheckSquare, 
  Bell, FileText, Settings, Plus, 
  Calendar, Trash2, CheckCircle, 
  Menu, X, Briefcase, Edit, BarChart2, User, 
  LogOut as SignOutIcon, Search, Filter, Clock, MessageSquare, Send, ChevronDown, Download, Play, Pause, FileDown, File, FileSpreadsheet, AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();

  // ================= STATE & DATA =================
  const [adminProfile, setAdminProfile] = useState({
    name: "",
    email: "",
    role: "Administrator",
    status: "Active"
  });

  const [employees, setEmployees] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]); 
  const [approvals, setApprovals] = useState([]); 
  
  // Activity Log State
  const [activityLog, setActivityLog] = useState([
      { id: 1, text: "Dashboard initialized", time: "Just now" }
  ]);

  // Admin Personal Attendance
  const [adminAttendance, setAdminAttendance] = useState({
    status: "Absent",
    checkIn: null,
    checkOut: null,
    totalSeconds: 0,
    history: [], // For history table
    leaves: []   // For leave requests
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [reportTab, setReportTab] = useState("tasks"); 
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  // Edit & Comment States
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingTask, setEditingTask] = useState(null);       
  const [viewingTask, setViewingTask] = useState(null);       
  const [newComment, setNewComment] = useState("");           

  // Forms
  const [taskForm, setTaskForm] = useState({ title: "", assignee: "", priority: "Medium", due: "", description: "" });
  const [employeeForm, setEmployeeForm] = useState({ name: "", role: "", dept: "", email: "", mobile: "" });
  // Leave Form
  const [leaveForm, setLeaveForm] = useState({ type: "Sick Leave", startDate: "", endDate: "", reason: "" });
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // ================= FETCH DATA =================
  useEffect(() => {
    if (session?.user) {
        setAdminProfile(prev => ({
            ...prev,
            name: session.user.name,
            email: session.user.email
        }));

        const fetchAdminData = async () => {
            try {
                const [usersRes, tasksRes, attendanceRes] = await Promise.all([
                    fetch('/api/users'), 
                    fetch('/api/tasks'),
                    fetch('/api/attendance')
                ]);
                
                if (usersRes.ok) {
                    const allUsers = await usersRes.json();
                    const onlyEmployees = allUsers.filter(u => 
                        !['admin', 'super-admin', 'Admin', 'Super Admin'].includes(u.role)
                    );
                    setEmployees(onlyEmployees);
                }

                if (tasksRes.ok) setAllTasks(await tasksRes.json());
                
                if (attendanceRes.ok) {
                    const logs = await attendanceRes.json();
                    setAttendanceLogs(logs); // For Reports
                    // Filter logs for this specific admin for their "Personal Attendance" tab
                    const myLogs = logs.filter(l => l.userEmail === session.user.email);
                    setAdminAttendance(prev => ({ ...prev, history: myLogs }));
                }

            } catch (error) {
                console.error("Failed to load admin data", error);
            }
        };
        fetchAdminData();
    }
  }, [session]);

  // ================= LOGIC =================
  
  // Timer Logic
  useEffect(() => {
    let interval;
    if (adminAttendance.status === 'Present') {
      interval = setInterval(() => {
        setAdminAttendance(prev => ({ ...prev, totalSeconds: prev.totalSeconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adminAttendance.status]);

  const formatDuration = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Helper to add activity
  const addActivity = (text) => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setActivityLog(prev => [{ id: Date.now(), text, time }, ...prev]);
  };

  // --- CHECK IN / OUT LOGIC ---
  const handleAdminCheckInToggle = () => {
      if (adminAttendance.status === 'Absent') {
          const now = new Date();
          setAdminAttendance(prev => ({ ...prev, status: 'Present', checkIn: now }));
          addActivity("Checked In for the day");
          updateAttendanceAPI('checkin');
      } else {
          setShowCheckoutModal(true);
      }
  };

  const confirmCheckout = async () => {
      const now = new Date();
      // Add to history immediately for UI
      const todayLog = { date: now.toLocaleDateString(), totalHours: formatDuration(adminAttendance.totalSeconds), status: 'Present' };
      
      setAdminAttendance(prev => ({ 
          ...prev, 
          status: 'Absent', 
          checkOut: now,
          history: [todayLog, ...prev.history]
      }));
      
      addActivity("Checked Out");
      setShowCheckoutModal(false);
      updateAttendanceAPI('checkout');
  };

  const updateAttendanceAPI = async (action) => {
      try {
        await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email, action })
        });
      } catch (error) { console.error("Admin attendance failed", error); }
  };

  // --- EXPORT LOGIC ---
  const handleExport = (type) => {
      setShowExportMenu(false);
      
      let dataToExport = [];
      let title = "";

      if (reportTab === 'tasks') { dataToExport = allTasks; title = "Task_Report"; } 
      else if (reportTab === 'employees') { dataToExport = employees; title = "Employee_Report"; } 
      else if (reportTab === 'attendance') { dataToExport = attendanceLogs; title = "Attendance_Report"; }

      if (dataToExport.length === 0) { alert("No data to export."); return; }

      if (type === 'pdf') {
          const printWindow = window.open('', '', 'height=600,width=800');
          printWindow.document.write('<html><head><title>' + title + '</title>');
          printWindow.document.write('<style>body{font-family: sans-serif; padding: 20px;} h1{color: #1e1b4b;} table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 12px; } th { background-color: #e0e7ff; color: #1e1b4b; font-weight: bold; }</style>');
          printWindow.document.write('</head><body>');
          printWindow.document.write(`<h1>${title.replace('_', ' ')}</h1>`);
          printWindow.document.write(`<p>Generated by Admin on: ${new Date().toLocaleString()}</p>`);
          
          const headers = Object.keys(dataToExport[0]);
          printWindow.document.write('<table><thead><tr>');
          headers.forEach(header => printWindow.document.write(`<th>${header.toUpperCase()}</th>`));
          printWindow.document.write('</tr></thead><tbody>');
          
          dataToExport.forEach(row => {
              printWindow.document.write('<tr>');
              headers.forEach(header => {
                  let val = row[header];
                  if(typeof val === 'object') val = JSON.stringify(val);
                  printWindow.document.write(`<td>${val !== undefined ? val : '-'}</td>`)
              });
              printWindow.document.write('</tr>');
          });
          
          printWindow.document.write('</tbody></table></body></html>');
          printWindow.document.close();
          printWindow.print();
      } 
      else if (type === 'csv') {
          const headers = Object.keys(dataToExport[0]).join(",");
          const rows = dataToExport.map(row => Object.values(row).map(value => `"${value}"`).join(",")).join("\n");
          const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `${title}_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  // ================= ACTIONS (CRUD) =================
  const handleSaveTask = async (e) => {
    e.preventDefault();
    const method = editingTask ? 'PUT' : 'POST';
    const payload = editingTask ? { ...taskForm, id: editingTask._id } : { ...taskForm, status: "To Do", type: "Employee" };
    try {
        const res = await fetch('/api/tasks', { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
        if (res.ok) {
            const savedTask = await res.json();
            if (editingTask) setAllTasks(prev => prev.map(t => t._id === savedTask._id ? savedTask : t));
            else setAllTasks([savedTask, ...allTasks]);
            setShowTaskModal(false);
            addActivity(`Task "${savedTask.title}" saved`);
        }
    } catch (error) { alert("Failed to save task"); }
  };

  const openTaskModal = (task = null) => {
    if (task) { setEditingTask(task); setTaskForm({ title: task.title, assignee: task.assignedTo, priority: task.priority, due: task.dueDate, description: task.description || "" }); } 
    else { setEditingTask(null); setTaskForm({ title: "", assignee: "", priority: "Medium", due: "", description: "" }); }
    setShowTaskModal(true);
  };

  const handleAddComment = async (taskId) => {
    if(!newComment.trim()) return;
    try {
      const res = await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, type: 'comment', comment: { text: newComment, author: session.user.name || "Admin" } }) });
      if (res.ok) {
        const updatedTask = await res.json();
        setAllTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        setViewingTask(updatedTask); setNewComment("");
      }
    } catch (error) { console.error("Comment failed"); }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    const method = editingEmployee ? 'PUT' : 'POST';
    const payload = editingEmployee ? { ...employeeForm, id: editingEmployee._id } : employeeForm;
    try {
        const res = await fetch('/api/users', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
            const savedUser = await res.json();
            if (editingEmployee) setEmployees(prev => prev.map(emp => emp._id === savedUser._id ? savedUser : emp));
            else setEmployees([...employees, savedUser]);
            closeEmployeeModal();
            addActivity(`Employee "${savedUser.name}" saved`);
        }
    } catch (error) { alert(`Failed to ${editingEmployee ? 'update' : 'add'} employee`); }
  };

  const handleSubmitLeave = (e) => {
      e.preventDefault();
      // Mock submission - in real app, POST to API
      const newLeave = { ...leaveForm, id: Date.now(), status: 'Pending' };
      setAdminAttendance(prev => ({ ...prev, leaves: [newLeave, ...prev.leaves] }));
      setShowLeaveModal(false);
      addActivity(`Requested ${leaveForm.type}`);
  };

  const openEditEmployee = (employee) => {
      setEditingEmployee(employee);
      setEmployeeForm({ name: employee.name, email: employee.email, role: employee.role || "", dept: employee.dept || "", mobile: employee.mobile || "" });
      setShowEmployeeModal(true);
  };

  const closeEmployeeModal = () => { setShowEmployeeModal(false); setEditingEmployee(null); setEmployeeForm({ name: "", role: "", dept: "", email: "", mobile: "" }); };
  const handleDeleteEmployee = async (id) => { if(confirm("Delete this employee?")) { setEmployees(prev => prev.filter(e => e._id !== id)); addActivity("Employee deleted"); } };
  const handleSignOut = () => { signOut({ callbackUrl: '/' }); };

  const getStatusColor = (status) => {
      switch(status) {
          case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
          case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
  };

  // ================= RENDERERS =================

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
        <h3 className="text-xl font-bold text-gray-800">Admin Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* My Status Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full"></div>
                <div>
                    <p className="text-indigo-100 text-xs font-bold uppercase">My Status</p>
                    <h3 className="text-2xl font-bold mt-1">{adminAttendance.status}</h3>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <span className="font-mono text-xl">{formatDuration(adminAttendance.totalSeconds)}</span>
                    <button onClick={handleAdminCheckInToggle} className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors font-bold text-sm border border-white/30">
                        {adminAttendance.status === 'Absent' ? <><Play size={16}/> Check In</> : <><Pause size={16}/> Check Out</>}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex justify-between items-start">
                <div><p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Employees</p><h3 className="text-3xl font-bold text-gray-800 mt-2">{employees.length}</h3></div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={24}/></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex justify-between items-start">
                <div><p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Active Tasks</p><h3 className="text-3xl font-bold text-gray-800 mt-2">{allTasks.length}</h3></div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><CheckSquare size={24}/></div>
            </div>
             <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex justify-between items-start">
                <div><p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Approvals</p><h3 className="text-3xl font-bold text-gray-800 mt-2">{approvals.length}</h3></div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><CheckCircle size={24}/></div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4">Quick Actions</h4>
                <div className="space-y-3">
                    <button onClick={()=>{setEditingEmployee(null); setShowEmployeeModal(true)}} className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 text-sm font-bold text-gray-700"><User size={18}/> Add Employee</button>
                    <button onClick={() => openTaskModal()} className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 text-sm font-bold text-gray-700"><CheckSquare size={18}/> Create Task</button>
                </div>
            </div>
            
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-y-auto max-h-[300px]">
                <h4 className="font-bold text-gray-800 mb-4">Recent Activity</h4>
                <div className="space-y-4">
                    {activityLog.map(act => (
                        <div key={act.id} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
                            <div>
                                <p className="text-sm font-bold text-gray-700">{act.text}</p>
                                <p className="text-xs text-gray-500">{act.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

  const renderAttendance = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">My Attendance</h3>
              <button onClick={() => setShowLeaveModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">
                  <Plus size={16}/> Request Leave
              </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Col: Today's Status & Timeline */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm text-center">
                      <div className="mb-4"><Clock size={48} className="mx-auto text-indigo-500"/></div>
                      <h2 className="text-3xl font-mono font-bold text-gray-800 mb-2">{formatDuration(adminAttendance.totalSeconds)}</h2>
                      <p className="text-sm text-gray-500 mb-6">{new Date().toLocaleDateString()}</p>
                      <button onClick={handleAdminCheckInToggle} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${adminAttendance.status==='Absent' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-500 hover:bg-red-600'}`}>
                          {adminAttendance.status === 'Absent' ? <><Play size={18}/> Check In</> : <><Pause size={18}/> Check Out</>}
                      </button>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-4 text-sm">Today's Timeline</h4>
                      <div className="space-y-4 pl-2 border-l-2 border-gray-100">
                          {adminAttendance.checkIn && (<div className="relative pl-4"><div className="absolute -left-[9px] top-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white"></div><p className="text-xs text-gray-500">{adminAttendance.checkIn.toLocaleTimeString()}</p><p className="text-sm font-bold text-gray-800">Checked In</p></div>)}
                          {adminAttendance.checkOut && (<div className="relative pl-4"><div className="absolute -left-[9px] top-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div><p className="text-xs text-gray-500">{adminAttendance.checkOut.toLocaleTimeString()}</p><p className="text-sm font-bold text-gray-800">Checked Out</p></div>)}
                          {!adminAttendance.checkIn && <p className="text-xs text-gray-400 pl-4">No activity today.</p>}
                      </div>
                  </div>
              </div>

              {/* Right Col: History & Leaves */}
              <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-4 text-sm">My Leave Requests (To Super Admin)</h4>
                      {adminAttendance.leaves.length === 0 ? <p className="text-sm text-gray-400 italic">No pending leave requests.</p> : (
                          <div className="space-y-2">
                              {adminAttendance.leaves.map(l => (
                                  <div key={l.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                      <span className="text-sm font-bold text-gray-700">{l.type}</span>
                                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">Pending</span>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-4 text-sm">Attendance History</h4>
                      <div className="overflow-hidden border border-gray-200 rounded-xl">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 border-b text-gray-500 text-xs uppercase font-bold">
                                  <tr><th className="p-3">Date</th><th className="p-3">Hours</th><th className="p-3">Status</th></tr>
                              </thead>
                              <tbody>
                                  {adminAttendance.history.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-400">No history available.</td></tr>}
                                  {adminAttendance.history.map((h, i) => (
                                      <tr key={i} className="border-b">
                                          <td className="p-3 text-gray-800 font-medium">{h.date}</td>
                                          <td className="p-3 text-gray-600 font-mono">{h.totalHours}</td>
                                          <td className="p-3"><span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold">{h.status}</span></td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderReports = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Reports Center</h3>
              <div className="relative">
                  <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 transition-colors">
                      <FileDown size={16}/> Export Data <ChevronDown size={16}/>
                  </button>
                  {showExportMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                          <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b"><FileSpreadsheet size={16}/> Export as CSV</button>
                          <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><File size={16}/> Export as PDF</button>
                      </div>
                  )}
              </div>
          </div>

          <div className="flex gap-4 border-b border-gray-200 pb-1">
              {['tasks', 'employees', 'attendance'].map(tab => (
                  <button 
                      key={tab}
                      onClick={() => setReportTab(tab)}
                      className={`pb-2 px-2 text-sm font-bold capitalize ${reportTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      {tab} Reports
                  </button>
              ))}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[300px]">
              {reportTab === 'tasks' && (
                  <div className="space-y-4">
                      <h4 className="font-bold text-gray-700">Task Completion Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-50 rounded-lg text-center"><p className="text-xs text-gray-500 uppercase">Total Tasks</p><p className="text-2xl font-bold text-gray-800">{allTasks.length}</p></div>
                          <div className="p-4 bg-green-50 rounded-lg text-center"><p className="text-xs text-green-600 uppercase">Completed</p><p className="text-2xl font-bold text-green-700">{allTasks.filter(t => t.status === 'Completed').length}</p></div>
                          <div className="p-4 bg-blue-50 rounded-lg text-center"><p className="text-xs text-blue-600 uppercase">In Progress</p><p className="text-2xl font-bold text-blue-700">{allTasks.filter(t => t.status === 'In Progress').length}</p></div>
                      </div>
                  </div>
              )}

              {reportTab === 'employees' && (
                  <div className="space-y-4">
                      <h4 className="font-bold text-gray-700">Employee List</h4>
                      <div className="overflow-hidden border border-gray-200 rounded-xl">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 border-b text-gray-500 text-xs uppercase font-bold">
                                  <tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Email</th><th className="p-3">Status</th></tr>
                              </thead>
                              <tbody>
                                  {employees.map(e => (
                                      <tr key={e._id} className="border-b hover:bg-gray-50">
                                          <td className="p-3 font-medium text-gray-800">{e.name}</td>
                                          <td className="p-3 text-gray-500">{e.role}</td>
                                          <td className="p-3 text-gray-500">{e.email}</td>
                                          <td className="p-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Active</span></td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {reportTab === 'attendance' && (
                  <div className="space-y-4">
                      <h4 className="font-bold text-gray-700">Attendance Log (All Employees)</h4>
                      <div className="overflow-hidden border border-gray-200 rounded-xl">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 border-b text-gray-500 text-xs uppercase font-bold">
                                  <tr><th className="p-3">Employee</th><th className="p-3">Date</th><th className="p-3">Hours</th><th className="p-3">Status</th></tr>
                              </thead>
                              <tbody>
                                  {attendanceLogs.map((l, i) => (
                                      <tr key={i} className="border-b hover:bg-gray-50">
                                          <td className="p-3 font-medium text-gray-800">{l.userEmail}</td>
                                          <td className="p-3 text-gray-500">{l.date}</td>
                                          <td className="p-3 text-gray-500 font-mono">{l.totalHours || '0'}h</td>
                                          <td className="p-3"><span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold">{l.status}</span></td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  const renderSettings = () => (
      <div className="space-y-6 animate-fade-in max-w-2xl">
          <h3 className="text-xl font-bold text-gray-800">System Settings</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Preferences</h4>
              <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Email Alerts</span><input type="checkbox" className="toggle" defaultChecked/></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Mode</span><input type="checkbox" className="toggle"/></div>
              </div>
          </div>
      </div>
  );

  // ... (Employees, Tasks, Performance, Approvals, Profile renderers remain consistent)
  const renderEmployees = () => (<div className="space-y-6 animate-fade-in"><div className="flex justify-between items-center"><h3 className="text-xl font-bold text-gray-800">Employee List</h3><div className="flex gap-2"><button className="p-2 border rounded-lg hover:bg-gray-50"><Search size={18} className="text-gray-500"/></button><button onClick={() => { setEditingEmployee(null); setShowEmployeeModal(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700"><Plus size={16}/> Add New</button></div></div>{employees.length === 0 ? (<div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center"><Users size={32} className="mx-auto text-gray-300 mb-2"/><h4 className="font-bold text-gray-800">No Employees Found</h4><p className="text-sm text-gray-500 mb-4">Start by adding your first employee.</p><button onClick={() => setShowEmployeeModal(true)} className="text-indigo-600 font-bold text-sm hover:underline">Add Employee Now</button></div>) : (<div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-gray-50 border-b text-gray-500 text-xs uppercase font-bold"><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Email</th><th className="p-4">Mobile</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{employees.map(e => (<tr key={e._id} className="hover:bg-gray-50 transition-colors"><td className="p-4 font-bold text-gray-800">{e.name}</td><td className="p-4 text-gray-600">{e.role}</td><td className="p-4 text-indigo-600">{e.email}</td><td className="p-4 text-gray-600">{e.mobile || '-'}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => openEditEmployee(e)} className="p-2 bg-gray-100 rounded text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"><Edit size={16}/></button><button onClick={() => handleDeleteEmployee(e._id)} className="p-2 bg-gray-100 rounded text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>)}</div>);
  const renderTasks = () => { const filtered = taskStatusFilter === "All" ? allTasks : allTasks.filter(t => t.status === taskStatusFilter); return (<div className="space-y-6 animate-fade-in"><div className="flex flex-col md:flex-row justify-between items-center gap-4"><h3 className="text-xl font-bold text-gray-800">Task Management</h3><div className="flex gap-4"><div className="relative"><select value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value)} className="appearance-none bg-white border border-gray-200 text-sm font-bold py-2 pl-4 pr-8 rounded-lg cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"><option value="All">All Status</option><option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option></select><ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none"/></div><button onClick={() => openTaskModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 transition-colors"><Plus size={16}/> Create Task</button></div></div>{filtered.length === 0 ? (<div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center"><CheckSquare size={32} className="mx-auto text-gray-300 mb-2"/><h4 className="font-bold text-gray-800">No {taskStatusFilter !== "All" ? taskStatusFilter : ""} Tasks Found</h4><p className="text-sm text-gray-500 mt-1">Adjust filters or create a new task.</p></div>) : (<div className="space-y-3">{filtered.map(task => (<div key={task._id} className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-all gap-4"><div className="flex items-start gap-4 flex-1"><div className={`p-2 rounded-lg mt-1 ${task.priority==='High'?'bg-red-100 text-red-600':'bg-blue-100 text-blue-600'}`}><CheckSquare size={18}/></div><div><h4 className="font-bold text-gray-800 text-sm">{task.title}</h4><p className="text-xs text-gray-500 mt-0.5">Assigned to: <b>{task.assignedTo}</b></p><p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Calendar size={10}/> Due: {task.dueDate}</p></div></div><span className={`px-3 py-1 rounded-md text-xs font-bold border w-fit ${getStatusColor(task.status)}`}>{task.status}</span><div className="flex items-center gap-2"><button onClick={() => setViewingTask(task)} className="p-2 bg-gray-100 rounded text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors relative"><MessageSquare size={16}/>{task.comments?.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}</button><button onClick={() => openTaskModal(task)} className="p-2 bg-gray-100 rounded text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"><Edit size={16}/></button><button className="p-2 bg-gray-100 rounded text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"><Trash2 size={16}/></button></div></div>))}</div>)}</div>); };
  const renderPerformance = () => (<div className="space-y-6 animate-fade-in"><h3 className="text-xl font-bold text-gray-800">Performance Metrics</h3><div className="bg-white p-12 rounded-xl border border-gray-200 text-center"><BarChart2 size={32} className="mx-auto text-gray-300 mb-2"/><h4 className="font-bold text-gray-800">No Performance Data</h4><p className="text-sm text-gray-500">Charts will populate once enough task data is gathered.</p></div></div>);
  const renderApprovals = () => (<div className="space-y-6 animate-fade-in"><h3 className="text-xl font-bold text-gray-800">Pending Approvals</h3>{approvals.length === 0 ? (<div className="bg-white p-12 rounded-xl border border-gray-200 text-center"><CheckCircle size={32} className="mx-auto text-gray-300 mb-2"/><h4 className="font-bold text-gray-800">No Pending Approvals</h4><p className="text-sm text-gray-500">Leave requests and corrections will appear here.</p></div>) : (<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"></div>)}</div>);
  const renderProfile = () => (<div className="space-y-6 animate-fade-in max-w-2xl mx-auto"><div className="bg-white rounded-xl border border-gray-200 p-8 text-center relative overflow-hidden shadow-sm"><div className="absolute top-0 left-0 w-full h-24 bg-indigo-600"></div><div className="relative z-10 w-24 h-24 mx-auto bg-white rounded-full p-1 shadow-lg"><div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">{adminProfile.name ? adminProfile.name[0] : "A"}</div></div><h2 className="text-2xl font-bold text-gray-800 mt-4">{adminProfile.name}</h2><p className="text-gray-500">Administrator</p><div className="mt-8 grid grid-cols-2 gap-6 text-left"><div><span className="text-xs font-bold text-gray-400 uppercase">Email</span><p className="font-medium">{adminProfile.email}</p></div><div><span className="text-xs font-bold text-gray-400 uppercase">Role</span><p className="font-medium">System Admin</p></div><div><span className="text-xs font-bold text-gray-400 uppercase">Status</span><p className="font-medium text-green-600">Active</p></div><div><span className="text-xs font-bold text-gray-400 uppercase">Access</span><p className="font-medium">Full</p></div></div><button onClick={handleSignOut} className="mt-8 w-full py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 flex items-center justify-center gap-2"><SignOutIcon size={18}/> Sign Out</button></div></div>);

  // ================= MAIN LAYOUT =================
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e1b4b] text-white flex flex-col transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
         <div className="p-6 text-xl font-bold border-b border-indigo-900 flex items-center gap-2">
             <Briefcase className="text-indigo-400"/> AdminPortal
         </div>
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
             {[
                 {id:'overview', l:'Overview', i:LayoutDashboard}, 
                 {id:'employees', l:'Employees', i:Users}, 
                 {id:'tasks', l:'Tasks', i:CheckSquare}, 
                 {id:'performance', l:'Performance', i:BarChart2},
                 {id:'attendance', l:'Attendance', i:Clock},
                 {id:'approvals', l:'Approvals', i:CheckCircle},
                 {id:'reports', l:'Reports', i:FileText},
                 {id:'settings', l:'Settings', i:Settings},
                 {id:'profile', l:'Profile', i:User}
             ].map(item => (
                 <button key={item.id} onClick={()=>{setActiveTab(item.id); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab===item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-200 hover:bg-indigo-900'}`}>
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
                 <h2 className="text-lg font-bold text-indigo-900 capitalize">{activeTab}</h2>
             </div>
             <div className="flex items-center gap-4">
                 <div className="relative"><Bell size={20} className="text-gray-500"/></div>
                 <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">AD</div>
             </div>
         </header>

         <main className="flex-1 overflow-y-auto p-4 lg:p-8">
             {activeTab === 'overview' && renderOverview()}
             {activeTab === 'employees' && renderEmployees()}
             {activeTab === 'tasks' && renderTasks()}
             {activeTab === 'performance' && renderPerformance()}
             {activeTab === 'attendance' && renderAttendance()}
             {activeTab === 'approvals' && renderApprovals()}
             {activeTab === 'reports' && renderReports()}
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
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to end your work day?</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-2 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                    <button onClick={confirmCheckout} className="flex-1 py-2 text-white font-bold bg-red-600 hover:bg-red-700 rounded-lg">Check Out</button>
                </div>
            </div>
        </div>
      )}

      {/* --- LEAVE MODAL --- */}
      {showLeaveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <form onSubmit={handleSubmitLeave} className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Request Leave</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Leave Type</label><select className="w-full p-2 border rounded-lg mt-1" onChange={e=>setLeaveForm({...leaveForm, type: e.target.value})}><option>Sick Leave</option><option>Casual Leave</option><option>Privilege Leave</option></select></div>
                        <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">From</label><input type="date" required className="w-full p-2 border rounded-lg mt-1" onChange={e=>setLeaveForm({...leaveForm, startDate: e.target.value})}/></div><div><label className="text-xs font-bold text-gray-500 uppercase">To</label><input type="date" required className="w-full p-2 border rounded-lg mt-1" onChange={e=>setLeaveForm({...leaveForm, endDate: e.target.value})}/></div></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Reason</label><textarea className="w-full p-2 border rounded-lg mt-1 h-20" placeholder="Reason for leave..." onChange={e=>setLeaveForm({...leaveForm, reason: e.target.value})}></textarea></div>
                    </div>
                    <div className="flex gap-4 mt-6">
                        <button type="button" onClick={()=>setShowLeaveModal(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Submit</button>
                    </div>
                </form>
            </div>
      )}

      {/* --- TASK MODAL --- */}
      {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <form onSubmit={handleSaveTask} className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800">{editingTask ? "Edit Task" : "Create New Task"}</h3>
                      <button type="button" onClick={()=>setShowTaskModal(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Title</label><input required className="w-full p-3 border rounded-lg mt-1" value={taskForm.title} onChange={e=>setTaskForm({...taskForm, title: e.target.value})} /></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Assignee</label><select className="w-full p-3 border rounded-lg mt-1" value={taskForm.assignee} onChange={e=>setTaskForm({...taskForm, assignee: e.target.value})}><option value="">Select Employee...</option>{employees.map(e=><option key={e._id} value={e.email}>{e.name}</option>)}</select></div>
                      <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Priority</label><select className="w-full p-3 border rounded-lg mt-1" value={taskForm.priority} onChange={e=>setTaskForm({...taskForm, priority: e.target.value})}><option>Medium</option><option>High</option><option>Critical</option></select></div><div><label className="text-xs font-bold text-gray-500 uppercase">Due Date</label><input type="date" className="w-full p-3 border rounded-lg mt-1" value={taskForm.due} onChange={e=>setTaskForm({...taskForm, due: e.target.value})} /></div></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Description</label><textarea className="w-full p-3 border rounded-lg mt-1 h-20" value={taskForm.description} onChange={e=>setTaskForm({...taskForm, description: e.target.value})}></textarea></div>
                  </div>
                  <button className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700">{editingTask ? "Update Task" : "Assign Task"}</button>
              </form>
          </div>
      )}

      {/* --- EMPLOYEE MODAL --- */}
      {showEmployeeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <form onSubmit={handleSaveEmployee} className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800">{editingEmployee ? "Edit Employee" : "Add Employee"}</h3>
                      <button type="button" onClick={closeEmployeeModal} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Full Name</label><input required className="w-full p-3 border rounded-lg mt-1" value={employeeForm.name} onChange={e=>setEmployeeForm({...employeeForm, name: e.target.value})} /></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input required type="email" className="w-full p-3 border rounded-lg mt-1" value={employeeForm.email} onChange={e=>setEmployeeForm({...employeeForm, email: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Role</label><input className="w-full p-3 border rounded-lg mt-1" placeholder="e.g. Designer" value={employeeForm.role} onChange={e=>setEmployeeForm({...employeeForm, role: e.target.value})} /></div><div><label className="text-xs font-bold text-gray-500 uppercase">Dept</label><input className="w-full p-3 border rounded-lg mt-1" placeholder="e.g. Design" value={employeeForm.dept} onChange={e=>setEmployeeForm({...employeeForm, dept: e.target.value})} /></div></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Mobile</label><input className="w-full p-3 border rounded-lg mt-1" placeholder="+1..." value={employeeForm.mobile} onChange={e=>setEmployeeForm({...employeeForm, mobile: e.target.value})} /></div>
                  </div>
                  <button className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700">{editingEmployee ? "Update User" : "Add User"}</button>
              </form>
          </div>
      )}

      {/* --- COMMENTS MODAL --- */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setViewingTask(null)}></div>
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-in-right flex flex-col">
                <div className="flex justify-between items-start mb-4"><h3 className="text-xl font-bold text-gray-800">Task Discussions</h3><button onClick={() => setViewingTask(null)} className="text-gray-400 hover:text-red-500"><X size={24}/></button></div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6"><h4 className="font-bold text-gray-800">{viewingTask.title}</h4><p className="text-xs text-gray-500 mt-1">{viewingTask.description || "No description."}</p><div className="mt-2 text-xs flex gap-2"><span className="bg-white border px-2 py-1 rounded">{viewingTask.priority}</span><span className="bg-white border px-2 py-1 rounded">{viewingTask.status}</span></div></div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">{viewingTask.comments?.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">No comments yet.</p>}{viewingTask.comments?.map((c, i) => (<div key={i} className={`p-3 rounded-xl max-w-[85%] text-sm ${c.author === (session?.user?.name || 'Admin') ? 'bg-indigo-50 border border-indigo-100 ml-auto' : 'bg-gray-100 mr-auto'}`}><p className="text-xs font-bold mb-1 opacity-70">{c.author}</p><p>{c.text}</p></div>))}</div>
                <div className="mt-4 pt-4 border-t flex gap-2"><input className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Type a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment(viewingTask._id)}/><button onClick={() => handleAddComment(viewingTask._id)} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"><Send size={18}/></button></div>
            </div>
        </div>
      )}
    </div>
  );
}