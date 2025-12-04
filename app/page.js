"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, User, Mail, Lock, Phone, Calendar, AlertCircle, X } from "lucide-react";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState("signin"); // 'signin' or 'signup'
  const [formData, setFormData] = useState({ name: "", email: "", password: "", mobile: "", dob: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (authMode === "signup") {
        // --- REGISTRATION LOGIC ---
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || "Registration failed");
        }

        // Success! Switch to login view
        alert("Registration Successful! Please Login.");
        setAuthMode("signin");
      } else {
        // --- LOGIN LOGIC ---
        const res = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (res?.error) {
          throw new Error("Invalid Credentials");
        }

        // Success! Go to dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop')" }}>
      
      <div className="absolute inset-0 bg-blue-900/90 mix-blend-multiply"></div>

      {/* ERROR POPUP */}
      {error && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 border-2 border-red-700">
            <AlertCircle size={24} />
            <span className="font-bold">{error}</span>
            <button onClick={() => setError("")} className="ml-4 hover:bg-red-700 rounded-full p-1 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Logo Section */}
        <div className="p-8 pb-0 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/50 shadow-lg">
            <Shield className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Aristostech Portal</h2>
          <p className="text-blue-200 text-sm mt-2 font-light">Secure Team Access</p>
        </div>

        <div className="p-8">
          {/* Toggle Switch */}
          <div className="flex gap-4 mb-6 p-1 bg-black/20 rounded-lg">
            <button
              type="button"
              onClick={() => { setAuthMode("signin"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${authMode === "signin" ? "bg-white text-blue-900 shadow-sm" : "text-blue-200 hover:text-white hover:bg-white/10"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("signup"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${authMode === "signup" ? "bg-white text-blue-900 shadow-sm" : "text-blue-200 hover:text-white hover:bg-white/10"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div className="space-y-4 animate-fade-in">
                <InputIcon icon={User} name="name" type="text" placeholder="Full Name" onChange={handleChange} />
                <InputIcon icon={Phone} name="mobile" type="tel" placeholder="Mobile Number" onChange={handleChange} />
                <InputIcon icon={Calendar} name="dob" type="date" placeholder="Date of Birth" onChange={handleChange} />
              </div>
            )}
            
            <InputIcon icon={Mail} name="email" type="email" placeholder="Email Address" onChange={handleChange} />
            <InputIcon icon={Lock} name="password" type="password" placeholder="Password" onChange={handleChange} />

            <button 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/50 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? "Processing..." : authMode === "signin" ? "Access Dashboard" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper Component for Inputs
function InputIcon({ icon: Icon, ...props }) {
  return (
    <div className="relative group">
      <div className="absolute left-3 top-3 text-blue-300 group-focus-within:text-blue-100 transition-colors">
        <Icon size={18} />
      </div>
      <input
        {...props}
        required
        className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all"
      />
    </div>
  );
}