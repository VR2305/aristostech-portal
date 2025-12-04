"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Users, Briefcase, Plus, LogOut, Edit, Save, X, FileText, RefreshCcw, Trash2, Calendar, ClipboardList, UserMinus } from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]); 
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  
  // Forms & Modals State
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [showTeamManager, setShowTeamManager] = useState(false); // Separate view for deleting users
  
  // Data State
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", mobile: "", dob: "", role: "employee" });
  const [taskData, setTaskData] = useState({ employeeId: "", taskTitle: "", taskDescription: "", taskTimePeriod: "" });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (filterDate) {
      setFilteredReports(reports.filter(r => r.date === filterDate));
    } else {
      setFilteredReports(reports);
    }
  }, [filterDate, reports]);

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchReports()]);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { cache: 'no-store' });
      const data = await res.json();
      setUsers(data.filter(u => u.role === 'employee'));
    } catch (error) { console.error("Error fetching users"); }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports", { cache: 'no-store' });
      const data = await res.json();
      setReports(data);
    } catch (error) { console.error("Error fetching reports"); }
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
      alert("✅ Employee Created Successfully!");
      setShowAddEmployee(false);
      setNewUser({ name: "", email: "", password: "", mobile: "", dob: "", role: "employee" });
      refreshData();
    } else { alert("❌ Error creating user"); }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if(!taskData.employeeId) return alert("Please select an employee");

    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: taskData.employeeId, 
        taskTitle: taskData.taskTitle, 
        taskDescription: taskData.taskDescription,
        taskTimePeriod: taskData.taskTimePeriod,
        taskStatus: "Pending" // Reset status for new task
      }),
    });

    if (res.ok) {
      alert("✅ Task Assigned Successfully!");
      setShowAssignTask(false);
      setTaskData({ employeeId: "", taskTitle: "", taskDescription: "", taskTimePeriod: "" });
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId) => {
    if(!confirm("⚠️ Are you sure? This will delete the employee and their data permanently.")) return;
    const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
    if (res.ok) { 
      alert("🗑️ User Deleted"); 
      fetchUsers(); 
    }
  };

  // --- NEW: DELETE REPORT FUNCTION ---
  const handleDeleteReport = async (reportId) => {
    if(!confirm("Are you sure you want to delete this daily report?")) return;
    
    const res = await fetch(`/api/reports?id=${reportId}`, { method: "DELETE" });
    
    if (res.ok) {
      alert("🗑️ Report Deleted Successfully");
      fetchReports(); // Refresh the list
    } else {
      alert("Error deleting report");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg"><Briefcase className="text-blue-600" size={24} /></div>
          <div><h1 className="text-xl font-bold text-gray-900">Admin Panel</h1><p className="text-xs text-gray-500">Task & Team Management</p></div>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors"><LogOut size={18} /> Logout</button>
      </nav>

      {/* --- ACTION BAR --- */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex gap-2">
            {/* MANAGE TEAM BUTTON (For Deleting Users) */}
            <button 
                onClick={() => { setShowTeamManager(!showTeamManager); setShowAssignTask(false); setShowAddEmployee(false); }} 
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-all ${showTeamManager ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
            >
                <UserMinus size={16}/> Manage Team
            </button>
            <button onClick={refreshData} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600" title="Refresh Data"><RefreshCcw size={18}/></button>
        </div>
        
        <div className="flex gap-3">
           {/* ASSIGN TASK BUTTON */}
           <button 
             onClick={() => { setShowAssignTask(!showAssignTask); setShowAddEmployee(false); setShowTeamManager(false); }} 
             className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md transition-all"
           >
             <ClipboardList size={16}/> {showAssignTask ? "Close Form" : "Assign Task"}
           </button>

           {/* ADD EMPLOYEE BUTTON */}
           <button 
             onClick={() => { setShowAddEmployee(!showAddEmployee); setShowAssignTask(false); setShowTeamManager(false); }} 
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md transition-all"
           >
             <Plus size={16}/> {showAddEmployee ? "Close Form" : "Add Employee"}
           </button>
        </div>
      </div>

      {/* --- SECTION 1: MANAGE TEAM MODAL (Separate Delete View) --- */}
      {showTeamManager && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8 animate-fade-in">
            <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2"><UserMinus size={20} className="text-red-500"/> Remove Employees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(u => (
                    <div key={u._id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                        <div><p className="font-bold text-sm text-gray-800">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                        <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- SECTION 2: FORMS (Assign Task / Add Employee) --- */}
      {showAssignTask && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-100 mb-8 animate-fade-in">
          <h3 className="text-purple-800 font-bold mb-4 flex items-center gap-2"><ClipboardList size={20}/> Assign New Task</h3>
          <form onSubmit={handleAssignTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Select Employee</label>
                <select 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-400 outline-none mt-1 bg-white text-gray-900"
                    onChange={e => setTaskData({...taskData, employeeId: e.target.value})}
                    required
                >
                    <option value="">-- Choose Employee --</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
            </div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Task Title</label><input placeholder="e.g. Update Homepage" required className="w-full p-2 border rounded-lg mt-1" onChange={e => setTaskData({...taskData, taskTitle: e.target.value})} /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Time Period</label><input placeholder="e.g. 2 Days" required className="w-full p-2 border rounded-lg mt-1" onChange={e => setTaskData({...taskData, taskTimePeriod: e.target.value})} /></div>
            <div className="col-span-1 md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Description</label><textarea placeholder="Detailed description..." rows="3" className="w-full p-2 border rounded-lg mt-1" onChange={e => setTaskData({...taskData, taskDescription: e.target.value})} /></div>
            <button className="col-span-1 md:col-span-2 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700">Save Task Assignment</button>
          </form>
        </div>
      )}

      {showAddEmployee && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 mb-8 animate-fade-in">
          <h3 className="text-blue-800 font-bold mb-4 flex items-center gap-2"><Plus size={20}/> Register New Employee</h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Full Name" required className="p-2 border rounded" onChange={e => setNewUser({...newUser, name: e.target.value})} />
              <input placeholder="Email" required className="p-2 border rounded" onChange={e => setNewUser({...newUser, email: e.target.value})} />
              <input placeholder="Password" required type="password" className="p-2 border rounded" onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <input placeholder="Mobile" required className="p-2 border rounded" onChange={e => setNewUser({...newUser, mobile: e.target.value})} />
              <input placeholder="DOB" type="date" required className="p-2 border rounded" onChange={e => setNewUser({...newUser, dob: e.target.value})} />
              <button className="bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Save Account</button>
          </form>
        </div>
      )}

      {/* --- SECTION 3: MAIN TABLE (Task Details) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 bg-gray-50"><h2 className="font-bold text-gray-800">Current Task Assignments</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-xs text-gray-500 uppercase font-bold tracking-wider border-b">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Assigned Task</th>
                <th className="p-4">Description</th>
                <th className="p-4">Time Period</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900">{user.name}</td>
                  <td className="p-4"><span className="text-purple-700 font-medium">{user.taskTitle || "Unassigned"}</span></td>
                  <td className="p-4 text-sm text-gray-600 truncate max-w-xs">{user.taskDescription || "-"}</td>
                  <td className="p-4 text-sm text-gray-800 font-mono">{user.taskTimePeriod || "-"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        user.taskStatus === 'Completed' ? 'bg-green-100 text-green-700' :
                        user.taskStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {user.taskStatus || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-500 italic">No employees found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SECTION 4: REPORTS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center flex-wrap gap-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
            <FileText size={20} className="text-emerald-600"/> Employee Daily Reports
          </h2>
          
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-300 shadow-sm">
            <Calendar size={16} className="text-gray-500"/>
            <span className="text-xs text-gray-500 font-medium">Filter Date:</span>
            <input type="date" className="text-sm text-gray-700 outline-none" onChange={(e) => setFilterDate(e.target.value)} />
            {filterDate && <button onClick={()=>setFilterDate("")} className="text-xs text-red-500 hover:underline ml-2">Clear</button>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-xs text-gray-500 uppercase font-bold tracking-wider border-b">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Employee</th>
                <th className="p-4">Work Title</th>
                <th className="p-4">Task Type</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-600 whitespace-nowrap font-mono">{report.date}</td>
                  <td className="p-4 font-medium text-gray-900">{report.userName}</td>
                  <td className="p-4 text-sm text-gray-800 font-medium">{report.workTitle}</td>
                  <td className="p-4 text-sm"><span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-medium">{report.taskType}</span></td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      report.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                      report.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {/* ACTIONABLE DELETE BUTTON */}
                    <button 
                      onClick={() => handleDeleteReport(report._id)} 
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                      title="Delete Report"
                    >
                        <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">{filterDate ? "No reports found for this date." : "No reports submitted yet."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}