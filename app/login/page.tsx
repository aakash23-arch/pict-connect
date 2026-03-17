"use client";

import { FormEvent, useState } from "react";
import { firebase } from "@/lib/firebase";

// Login page for PICT students using Google Sign-In or email-link auth
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      // Hint to use ms.pict.edu domain
      provider.setCustomParameters({ hd: "ms.pict.edu" });

      const result = await firebase.auth().signInWithPopup(provider);

      // Validate that the user is using @ms.pict.edu email
      if (!result.user?.email?.endsWith("@ms.pict.edu")) {
        await firebase.auth().signOut();
        alert("Please use your official @ms.pict.edu Google account.");
        setGoogleLoading(false);
        return;
      }

      // Successful login, redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      let errorMessage = "Failed to sign in with Google. Please try again.";

      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in cancelled. Please try again.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup blocked. Please allow popups for this site.";
      } else if (error.code === "auth/unauthorized-domain") {
        errorMessage = "This domain is not authorized. Please contact support.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      alert(errorMessage);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Only allow @ms.pict.edu emails
    if (!email.endsWith("@ms.pict.edu")) {
      alert("Please use your official @ms.pict.edu email address.");
      return;
    }

    setLoading(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login/verify`,
        handleCodeInApp: true,
      };

      await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);

      window.localStorage.setItem("emailForSignIn", email);
      alert("Login link sent! Please check your PICT email.");
    } catch (error: any) {
      console.error("Error sending login link:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      // Display more specific error messages
      let errorMessage = "Failed to send login link. Please try again.";

      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format. Please use your @ms.pict.edu email.";
      } else if (error.code === "auth/unauthorized-continue-uri") {
        errorMessage = "Configuration error: Unauthorized redirect URL. Please contact support.";
      } else if (error.code === "auth/invalid-continue-uri") {
        errorMessage = "Configuration error: Invalid redirect URL. Please contact support.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Login to PICT Connect</h1>
        <p className="mb-6 text-sm text-gray-600">
          Use your official <span className="font-semibold">@ms.pict.edu</span> account to sign in.
        </p>

        {/* Google Sign-In Button */}
        <button
          onClick={signInWithGoogle}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading ? "Signing in..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-xs text-gray-500">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Email Link Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">PICT Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourid@ms.pict.edu"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Sending link..." : "Send login link"}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500">
          For security reasons, links expire after a short time. If it doesn&apos;t work, request a new one.
        </p>
      </div>
    </div>
  );
}
