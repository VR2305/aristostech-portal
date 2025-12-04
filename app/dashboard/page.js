"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 1. Wait until authentication is finished loading
    if (status === "loading") return;

    // 2. If not logged in, force redirect to Login Page
    if (!session) {
      router.push("/");
    } else {
      // 3. Check Role and Redirect to specific Dashboard
      if (session.user.role === "super-admin") {
        router.push("/dashboard/super-admin");
      } else if (session.user.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/employee"); // Default fallback
      }
    }
  }, [session, status, router]);

  // 4. Loading Screen while redirecting
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 animate-pulse">Redirecting to your portal...</h2>
      </div>
    </div>
  );
}