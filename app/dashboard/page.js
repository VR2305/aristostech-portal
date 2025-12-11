"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 1. Wait until authentication is finished loading
    if (status === "loading") return;

    // 2. If not logged in, force redirect to Login Page
    if (status === "unauthenticated") {
      router.push("/login"); // <--- Changed from "/" to "/login" to avoid infinite loop
    } else if (status === "authenticated") {
      // 3. Check Role and Redirect to specific Dashboard
      const role = session?.user?.role;

      // Check for Super Admin
      if (role === "super-admin" || role === "SuperAdmin") {
        router.push("/dashboard/super-admin");
      } 
      // Check for Admin (handling case sensitivity)
      else if (role === "admin" || role === "Admin") {
        router.push("/dashboard/admin");
      } 
      // Default to Employee for everyone else
      else {
        router.push("/dashboard/employee"); 
      }
    }
  }, [session, status, router]);

  // 4. Loading Screen while redirecting
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-700 animate-pulse">Accessing Portal...</h2>
        <p className="text-sm text-gray-500 mt-2">Verifying your credentials</p>
      </div>
    </div>
  );
}