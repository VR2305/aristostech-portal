"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  Shield, LogOut, UserPlus, Users, Briefcase, Search, 
  Trash2, FileText, RefreshCcw, Download, Calendar, 
  ClipboardList, CheckCircle, UserMinus, X 
} from "lucide-react";

export default function SuperAdminDashboard() {
  const { data: session } = useSession();
  
  // --- Data States ---
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // --- Filter States ---
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredReports, setFilteredReports] = useState([]);
  const [reportFilterDate, setReportFilterDate] = useState("");
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [taskFilterStatus, setTaskFilterStatus] = useState("All");
  
  // --- UI States ---
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", mobile: "", dob: "", role: "employee" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  // Filters
  useEffect(() => {
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      setFilteredUsers(users.filter(u => u.name.toLowerCase().includes(lowerTerm) || u.email.toLowerCase().includes(lowerTerm)));
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  useEffect(() => {
    if (reportFilterDate) {
      setFilteredReports(reports.filter(r => r.date === reportFilterDate));
    } else {
      setFilteredReports(reports);
    }
  }, [reportFilterDate, reports]);

  useEffect(() => {
    if (taskFilterStatus !== "All") {
        setFilteredTasks(tasks.filter(t => t.status === taskFilterStatus));
    } else {
        setFilteredTasks(tasks);
    }
  }, [taskFilterStatus, tasks]);

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchGlobalReports(), fetchGlobalTasks()]);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { cache: 'no-store' });
      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) { console.error("Error"); }
  };

  const fetchGlobalReports = async () => {
    try {
      const res = await fetch("/api/reports", { cache: 'no-store' });
      const data = await res.json();
      setReports(data);
    } catch (error) { console.error("Error"); }
  };

  const fetchGlobalTasks = async () => {
    try {
      const res = await fetch("/api/tasks", { cache: 'no-store' });
      const data = await res.json();
      setTasks(data);
    } catch (error) { console.error("Error"); }
  };

  // --- ACTIONS ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      alert("✅ Account Created!");
      setShowUserForm(false);
      setNewUser({ name: "", email: "", password: "", mobile: "", dob: "", role: "employee" });
      refreshData();
    } else { alert("❌ Error creating user"); }
  };

  const handleDeleteUser = async (userId) => {
    if(!confirm("⚠️ CRITICAL: Delete this user permanently?")) return;
    const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
    if (res.ok) { alert("🗑️ User Deleted"); refreshData(); }
  };

  const handleDeleteTask = async (taskId) => {
    if(!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
    if (res.ok) { alert("🗑️ Task Deleted"); refreshData(); }
  };

  const handleDeleteReport = async (reportId) => {
    if(!confirm("Delete this report?")) return;
    const res = await fetch(`/api/reports?id=${reportId}`, { method: "DELETE" });
    if (res.ok) { alert("🗑️ Report Deleted"); refreshData(); }
  };

  // Counts
  const totalStaff = users.filter(u => u.role !== 'super-admin').length;
  const activeTasksCount = tasks.filter(t => t.status !== 'Completed').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-lg text-white"><Shield size={24}/></div>
          <div><h1 className="text-xl font-bold text-gray-900">Super Admin</h1><p className="text-xs text-gray-500">Master Overview</p></div>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors"><LogOut size={18}/> Logout</button>
      </nav>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3 shadow-sm">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></div>
             <div><p className="text-xs text-gray-400 font-bold uppercase">Total Staff</p><p className="text-xl font-bold text-gray-800">{totalStaff}</p></div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3 shadow-sm">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ClipboardList size={20}/></div>
             <div><p className="text-xs text-gray-400 font-bold uppercase">Active Tasks</p><p className="text-xl font-bold text-gray-800">{activeTasksCount}</p></div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3 shadow-sm">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FileText size={20}/></div>
             <div><p className="text-xs text-gray-400 font-bold uppercase">Total Reports</p><p className="text-xl font-bold text-gray-800">{reports.length}</p></div>
         </div>
      </div>

      {/* --- SECTION 1: USER DIRECTORY --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg"><Users size={20} className="text-purple-600"/> User Directory</h2>
          <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input placeholder="Search users..." className="pl-9 pr-4 py-2 border rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-purple-500" onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <button onClick={() => setShowUserForm(!showUserForm)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md">
               <UserPlus size={16}/> {showUserForm ? "Close" : "Create User"}
             </button>
          </div>
        </div>

        {showUserForm && (
          <div className="p-6 bg-purple-50 border-b border-purple-100 animate-fade-in">
            <h3 className="font-bold text-purple-900 mb-4 text-sm uppercase">Register New Account</h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Full Name" required className="p-2 rounded border text-sm" onChange={e=>setNewUser({...newUser, name: e.target.value})}/>
              <input placeholder="Email" required className="p-2 rounded border text-sm" onChange={e=>setNewUser({...newUser, email: e.target.value})}/>
              <input placeholder="Password" required type="password" className="p-2 rounded border text-sm" onChange={e=>setNewUser({...newUser, password: e.target.value})}/>
              <input placeholder="Mobile" required className="p-2 rounded border text-sm" onChange={e=>setNewUser({...newUser, mobile: e.target.value})}/>
              <input placeholder="DOB" type="date" required className="p-2 rounded border text-sm" onChange={e=>setNewUser({...newUser, dob: e.target.value})}/>
              <select className="p-2 rounded border text-sm bg-white" onChange={e=>setNewUser({...newUser, role: e.target.value})}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
              <button className="bg-purple-600 text-white p-2 rounded font-bold hover:bg-purple-700 col-span-1 md:col-span-3 shadow-sm">Create Account</button>
            </form>
          </div>
        )}

        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-xs text-gray-600 uppercase font-bold sticky top-0">
              <tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Email</th><th className="p-4">Mobile</th><th className="p-4 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{user.name}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.role==='admin'?'bg-blue-100 text-blue-700':user.role==='super-admin'?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-700'}`}>{user.role}</span></td>
                  <td className="p-4 text-sm text-gray-600">{user.email}</td>
                  <td className="p-4 text-sm text-gray-600">{user.mobile}</td>
                  <td className="p-4 text-right">
                    {user.role !== 'super-admin' && <button onClick={() => handleDeleteUser(user._id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SECTION 2: GLOBAL TASK OVERSIGHT --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg"><ClipboardList size={20} className="text-blue-600"/> Global Tasks</h2>
            <select className="p-2 border rounded-lg text-sm bg-white outline-none" onChange={(e) => setTaskFilterStatus(e.target.value)}>
                <option value="All">All Status</option>
                <option value="To-Do">To-Do</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
            </select>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-100 text-xs text-gray-600 uppercase font-bold sticky top-0">
                    <tr><th className="p-4">Task</th><th className="p-4">Assigned To</th><th className="p-4">Priority</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredTasks.map((task) => (
                        <tr key={task._id} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-gray-800">{task.title}</td>
                            <td className="p-4 text-sm text-gray-600">{task.assignedToName}</td>
                            <td className="p-4"><span className={`text-xs px-2 py-1 rounded font-bold ${task.priority==='High'?'bg-red-100 text-red-700':'bg-blue-50 text-blue-700'}`}>{task.priority}</span></td>
                            <td className="p-4"><span className={`text-xs font-bold ${task.status==='Completed'?'text-green-600':'text-gray-600'}`}>{task.status}</span></td>
                            <td className="p-4 text-right"><button onClick={() => handleDeleteTask(task._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- SECTION 3: GLOBAL REPORTS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg"><FileText size={20} className="text-emerald-600"/> Global Reports</h2>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-300 shadow-sm">
                <Calendar size={16} className="text-gray-500"/>
                <input type="date" className="text-sm text-gray-700 outline-none" onChange={(e) => setReportFilterDate(e.target.value)}/>
                {reportFilterDate && <button onClick={()=>setReportFilterDate("")} className="text-xs text-red-500 hover:underline ml-2">Clear</button>}
            </div>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-100 text-xs text-gray-600 uppercase font-bold sticky top-0">
                    <tr><th className="p-4">Date</th><th className="p-4">Employee</th><th className="p-4">Work Title</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredReports.map((report) => (
                        <tr key={report._id} className="hover:bg-gray-50">
                            <td className="p-4 text-sm text-gray-500 font-mono">{report.date}</td>
                            <td className="p-4 font-bold text-gray-800">{report.userName}</td>
                            <td className="p-4 text-sm text-gray-600">{report.workTitle}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${report.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{report.status}</span></td>
                            <td className="p-4 text-right"><button onClick={() => handleDeleteReport(report._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}