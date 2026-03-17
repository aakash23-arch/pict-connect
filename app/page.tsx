"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../components/UserContext";

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-600">
      Redirecting to your dashboard...
    </div>
  );
}
