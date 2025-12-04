"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Shield, LogOut, UserPlus, Users, Briefcase, Search, Trash2, FileText, RefreshCcw, Download, Calendar, Filter } from "lucide-react";

export default function SuperAdminDashboard() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]); // Global reports
  
  // Filter States
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [filteredReports, setFilteredReports] = useState([]);
  const [reportFilterDate, setReportFilterDate] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", mobile: "", dob: "", role: "employee" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.name.toLowerCase().includes(lowerTerm) || 
        u.email.toLowerCase().includes(lowerTerm)
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  // Filter reports when date changes
  useEffect(() => {
    if (reportFilterDate) {
      setFilteredReports(reports.filter(r => r.date === reportFilterDate));
    } else {
      setFilteredReports(reports);
    }
  }, [reportFilterDate, reports]);

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchGlobalReports()]);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { cache: 'no-store' });
      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) { console.error("Error fetching users"); }
  };

  const fetchGlobalReports = async () => {
    try {
      const res = await fetch("/api/reports", { cache: 'no-store' }); // Fetches ALL reports
      const data = await res.json();
      setReports(data);
    } catch (error) { console.error("Error fetching reports"); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (res.ok) {
      alert("✅ Account Created Successfully!");
      setShowForm(false);
      setNewUser({ name: "", email: "", password: "", mobile: "", dob: "", role: "employee" });
      refreshData();
    } else {
      alert("❌ Error creating user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if(!confirm("⚠️ CRITICAL WARNING: This will permanently delete this user and all their data. Are you sure?")) return;
    
    const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
    if (res.ok) {
      alert("🗑️ User Deleted");
      refreshData();
    }
  };

  const handleExportUsers = () => {
    alert("📥 Exporting User Data to CSV... (Simulation)");
    // Logic for CSV export would go here
  };

  // Calculate Total Users EXCLUDING Super Admin
  const totalUsersCount = users.filter(u => u.role !== 'super-admin').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg"><Shield className="text-purple-600" size={24}/></div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Super Admin</h1>
            <p className="text-xs text-gray-500">Master Control Panel</p>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="flex gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg font-medium transition-colors">
          <LogOut size={18}/> Logout
        </button>
      </nav>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs font-bold uppercase">Total Users (Staff)</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{totalUsersCount}</p>
          <p className="text-xs text-gray-400 mt-1">Excludes Super Admins</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs font-bold uppercase">Admins</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs font-bold uppercase">Employees</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{users.filter(u => u.role === 'employee').length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs font-bold uppercase">Total Reports</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{reports.length}</p>
        </div>
      </div>

      {/* --- SYSTEM USERS SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
            <Users size={20} className="text-purple-600"/> System Users
          </h2>
          
          <div className="flex gap-2 w-full md:w-auto flex-wrap">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    placeholder="Search users..." 
                    className="pl-10 pr-4 py-2 border rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <button onClick={handleExportUsers} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 flex items-center gap-2 text-sm font-medium" title="Export CSV">
                <Download size={16}/> <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={refreshData} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600" title="Refresh"><RefreshCcw size={18}/></button>
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-md"
            >
              <UserPlus size={16}/> {showForm ? "Close" : "Create User"}
            </button>
          </div>
        </div>

        {/* Create User Form */}
        {showForm && (
          <div className="p-6 bg-purple-50 border-b border-purple-100 animate-fade-in">
            <h3 className="font-bold text-purple-900 mb-4">Create New Account</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Full Name" required className="p-2 rounded border outline-none" onChange={e=>setNewUser({...newUser, name: e.target.value})}/>
              <input placeholder="Email" required className="p-2 rounded border outline-none" onChange={e=>setNewUser({...newUser, email: e.target.value})}/>
              <input placeholder="Password" required type="password" className="p-2 rounded border outline-none" onChange={e=>setNewUser({...newUser, password: e.target.value})}/>
              <input placeholder="Mobile" required className="p-2 rounded border outline-none" onChange={e=>setNewUser({...newUser, mobile: e.target.value})}/>
              <input placeholder="DOB" type="date" required className="p-2 rounded border outline-none" onChange={e=>setNewUser({...newUser, dob: e.target.value})}/>
              <select className="p-2 rounded border outline-none" onChange={e=>setNewUser({...newUser, role: e.target.value})}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
              <button className="bg-purple-600 text-white p-2 rounded font-bold hover:bg-purple-700 col-span-1 md:col-span-3 shadow-sm">Create Account</button>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-xs text-gray-600 uppercase font-bold tracking-wider">
              <tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Email</th><th className="p-4">Mobile</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{user.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      user.role==='admin' ? 'bg-blue-100 text-blue-700' : 
                      user.role==='super-admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{user.email}</td>
                  <td className="p-4 text-sm text-gray-600">{user.mobile}</td>
                  <td className="p-4 text-right">
                    {user.role !== 'super-admin' && (
                        <button onClick={() => handleDeleteUser(user._id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors" title="Delete User">
                            <Trash2 size={16} />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-500">No users found matching "{searchTerm}".</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- GLOBAL ACTIVITY LOG (ALL REPORTS) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <FileText size={20} className="text-emerald-600"/> Global Activity Log
            </h2>
            
            {/* New Feature: Date Filter for Global Reports */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-300 shadow-sm">
                <Calendar size={16} className="text-gray-500"/>
                <span className="text-xs text-gray-500 font-medium">Filter Date:</span>
                <input 
                  type="date" 
                  className="text-sm text-gray-700 outline-none"
                  onChange={(e) => setReportFilterDate(e.target.value)}
                />
                {reportFilterDate && <button onClick={()=>setReportFilterDate("")} className="text-xs text-red-500 hover:underline ml-2">Clear</button>}
            </div>
        </div>
        
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-100 text-xs text-gray-600 uppercase font-bold sticky top-0">
                    <tr><th className="p-4">Date</th><th className="p-4">Employee</th><th className="p-4">Work Title</th><th className="p-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredReports.map((report) => (
                        <tr key={report._id} className="hover:bg-gray-50">
                            <td className="p-4 text-sm text-gray-500 font-mono">{report.date}</td>
                            <td className="p-4 font-bold text-gray-800">{report.userName}</td>
                            <td className="p-4 text-sm text-gray-600">{report.workTitle}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    report.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {report.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {filteredReports.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500">No reports found.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
}