"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import firebase from "firebase/compat/app";

type User = firebase.User | null;

export interface UserProfile {
  displayName?: string;
  role?: "student" | "cr" | "organizer" | "admin";
  enrollmentNo?: string;
  branch?: string;
  year?: string;
  division?: string;
  rollNo?: string;
  grades?: { semester: number; sgpa: number }[];
  cgpa?: number;
  interests?: string;
  skills?: string;
  achievements?: string;
  relationshipStatus?: string;
}

interface UserContextValue {
  user: User;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => { },
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (email: string) => {
    try {
      const doc = await db.collection("users").doc(email).get();
      if (doc.exists) {
        setProfile(doc.data() as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: User) => {
      setUser(firebaseUser);
      if (firebaseUser?.email) {
        try {
          const docRef = db.collection("users").doc(firebaseUser.email);
          const doc = await docRef.get();
          
          if (!doc.exists) {
            const newProfile = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "",
              role: "student",
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await docRef.set(newProfile);
            setProfile(newProfile as UserProfile);
          } else {
            setProfile(doc.data() as UserProfile);
          }
        } catch (error) {
          console.error("Error during auth state change:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user?.email) {
      await fetchProfile(user.email);
    }
  };

  return (
    <UserContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

