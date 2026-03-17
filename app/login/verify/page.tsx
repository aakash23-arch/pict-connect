"use client";

import { useEffect } from "react";
import { firebase } from "@/lib/firebase";
import "firebase/compat/auth";

// Email-link verification page using Firebase v8 compat SDK
export default function VerifyPage() {
  useEffect(() => {
    const isSignInLink = firebase.auth().isSignInWithEmailLink(window.location.href);

    if (isSignInLink) {
      let email = window.localStorage.getItem("emailForSignIn");

      if (!email) {
        email = window.prompt("Please enter your PICT email to complete login:") || "";
      }

      firebase
        .auth()
        .signInWithEmailLink(email, window.location.href)
        .then(() => {
          window.localStorage.removeItem("emailForSignIn");
          window.location.href = "/dashboard";
        })
        .catch((error: firebase.auth.Error) => {
          console.error("Error verifying login:", error);
          alert("Error verifying login. Please try again.");
          window.location.href = "/login";
        });
    } else {
      alert("Invalid login link.");
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="text-center mt-20 text-xl font-medium">
      Verifying your login...
    </div>
  );
}
