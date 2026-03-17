"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./UserContext";

interface ProtectedPageProps {
  children: ReactNode;
}

// Simple client-side route protection wrapper.
// All app pages except /login and /login/verify should use this.
export default function ProtectedPage({ children }: ProtectedPageProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-600">
        <div className="rounded-md bg-white px-6 py-4 text-sm shadow">Checking your session...</div>
      </div>
    );
  }

  return <>{children}</>;
}

