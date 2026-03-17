"use client";

import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { db } from "../../lib/firebase";
import { useUser } from "../../components/UserContext";
import firebase from "firebase/compat/app";

type ResourceType = "notes" | "papers" | "resources";

interface AcademicResource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  createdAt?: firebase.firestore.Timestamp;
  createdBy: string;
}

const SECTIONS: { key: ResourceType; label: string }[] = [
  { key: "notes", label: "Notes" },
  { key: "papers", label: "Previous year papers" },
  { key: "resources", label: "Resources" },
];

export default function AcademicsPage() {
  const { user } = useUser();
  const [subject, setSubject] = useState("CoA");
  const [activeType, setActiveType] = useState<ResourceType>("notes");
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Simple role flag: treat certain emails as admins/CRs.
  // In a real app this should live in Firestore.
  const isAcademicAdmin = !!user?.email && user.email.endsWith("@ms.pict.edu") && user.email.includes("cr");

  useEffect(() => {
    const ref = db
      .collection("academics")
      .doc(subject)
      .collection("resources")
      .where("type", "==", activeType)
      .orderBy("createdAt", "desc");

    const unsubscribe = ref.onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
      const data: AcademicResource[] = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as Omit<AcademicResource, "id">),
      }));
      setResources(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [subject, activeType]);

  const handleAddResource = async () => {
    if (!user?.email) return;
    if (!isAcademicAdmin) {
      alert("Only admins / CRs can upload resources.");
      return;
    }

    if (!title.trim() || !url.trim()) {
      alert("Please provide a title and link.");
      return;
    }

    setUploading(true);
    try {
      await db
        .collection("academics")
        .doc(subject)
        .collection("resources")
        .add({
          title: title.trim(),
          url: url.trim(),
          type: activeType,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: user.email,
        });

      setTitle("");
      setUrl("");
    } catch (error) {
      console.error("Error adding academic resource", error);
      alert("Could not add resource. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-blue-700 dark:text-blue-500">Academics</h1>
        <p className="text-sm text-gray-600">
          Centralised notes, previous year papers and resources for PICT students.
        </p>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-700">Subject:</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="CoA">CoA</option>
              <option value="DSA">DSA</option>
              <option value="DBMS">DBMS</option>
              <option value="OS">OS</option>
              <option value="Maths">Maths</option>
            </select>
          </div>

          <div className="flex gap-2 text-xs text-gray-500">
            <span>Any logged-in user can view resources.</span>
            <span className="hidden md:inline">Only admins / CRs can upload.</span>
          </div>
        </div>

        <div className="flex gap-2 rounded-lg bg-white p-1 text-sm shadow-sm ring-1 ring-gray-200">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveType(s.key)}
              className={`flex-1 rounded-md px-3 py-2 ${activeType === s.key
                ? "bg-red-600 text-white"
                : "bg-transparent text-gray-800 hover:bg-gray-50"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {isAcademicAdmin && (
          <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              Add {SECTIONS.find((s) => s.key === activeType)?.label.toLowerCase()}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Unit 1 notes, 2023 SE IT paper..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Link (Google Drive / PDF URL)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
              <button
                onClick={handleAddResource}
                disabled={uploading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Add resource"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Upload only clean, academic content. Ensure shared links are accessible to PICT students.
            </p>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {SECTIONS.find((s) => s.key === activeType)?.label} for {subject}
          </h2>

          {loading && <div className="text-sm text-gray-600">Loading resources...</div>}

          {!loading && resources.length === 0 && (
            <div className="rounded-md bg-white p-4 text-sm text-gray-600 shadow">
              No resources added yet for this subject and section.
            </div>
          )}

          <div className="space-y-2">
            {resources.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-white p-3 text-sm shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Added by {r.createdBy}
                    </p>
                  </div>
                  {r.createdAt && (
                    <span className="whitespace-nowrap text-[11px] text-gray-500">
                      {r.createdAt.toDate().toLocaleDateString()}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </ProtectedPage>
  );
}

