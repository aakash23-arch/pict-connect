"use client";

import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { useUser, UserProfile } from "../../components/UserContext";
import { db } from "../../lib/firebase";

export default function ProfilePage() {
    const { user, profile, refreshProfile } = useUser();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<UserProfile>({});

    useEffect(() => {
        if (profile) {
            setFormData(profile);
        }
    }, [profile]);

    const handleChange = (field: keyof UserProfile, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleGradeChange = (index: number, field: "sgpa", value: string) => {
        const newGrades = [...(formData.grades || [])];
        if (!newGrades[index]) {
            newGrades[index] = { semester: index + 1, sgpa: 0 };
        }
        newGrades[index].sgpa = parseFloat(value) || 0;
        setFormData((prev) => ({ ...prev, grades: newGrades }));
    };

    const handleSave = async () => {
        if (!user?.email) return;
        setSaving(true);
        try {
            await db.collection("users").doc(user.email).set(formData, { merge: true });
            await refreshProfile();
            setEditing(false);
        } catch (error) {
            console.error("Error saving profile", error);
            alert("Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    // Helper to determine year options
    const getSemestersForYear = (year?: string) => {
        switch (year) {
            case "FE": return [1, 2];
            case "SE": return [1, 2, 3, 4];
            case "TE": return [1, 2, 3, 4, 5, 6];
            case "BE": return [1, 2, 3, 4, 5, 6, 7, 8];
            default: return [];
        }
    };

    const semesters = getSemestersForYear(formData.year);

    return (
        <ProtectedPage>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-500">My Profile</h1>
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow ring-1 ring-gray-200 p-6 space-y-6">
                    {/* Basic Info */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Academic Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                <input
                                    type="text"
                                    disabled={!editing}
                                    value={formData.displayName || ""}
                                    onChange={(e) => handleChange("displayName", e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Enrollment No.</label>
                                <input
                                    type="text"
                                    disabled={!editing}
                                    value={formData.enrollmentNo || ""}
                                    onChange={(e) => handleChange("enrollmentNo", e.target.value)}
                                    placeholder="e.g. I2K12345"
                                    maxLength={8}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Branch</label>
                                <select
                                    disabled={!editing}
                                    value={formData.branch || ""}
                                    onChange={(e) => handleChange("branch", e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                >
                                    <option value="">Select Branch</option>
                                    <option value="Computers">Computers</option>
                                    <option value="IT">IT</option>
                                    <option value="ENTC">ENTC</option>
                                    <option value="AI&DS">AI&DS</option>
                                    <option value="ECE">ECE</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Year</label>
                                <select
                                    disabled={!editing}
                                    value={formData.year || ""}
                                    onChange={(e) => handleChange("year", e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                >
                                    <option value="">Select Year</option>
                                    <option value="FE">FE (First Year)</option>
                                    <option value="SE">SE (Second Year)</option>
                                    <option value="TE">TE (Third Year)</option>
                                    <option value="BE">BE (Final Year)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Division</label>
                                <input
                                    type="text"
                                    disabled={!editing}
                                    value={formData.division || ""}
                                    onChange={(e) => handleChange("division", e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Roll No.</label>
                                <input
                                    type="text"
                                    disabled={!editing}
                                    value={formData.rollNo || ""}
                                    onChange={(e) => handleChange("rollNo", e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Grades */}
                    {formData.year && (
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Grades (SGPA)</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {semesters.map((sem) => {
                                    const grade = formData.grades?.find(g => g.semester === sem)?.sgpa || "";
                                    return (
                                        <div key={sem}>
                                            <label className="block text-xs font-medium text-gray-600">Sem {sem}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="10"
                                                disabled={!editing}
                                                value={grade}
                                                onChange={(e) => handleGradeChange(sem - 1, "sgpa", e.target.value)}
                                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Personal Info */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Details</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
                            <input
                                type="text"
                                disabled={!editing}
                                value={formData.skills || ""}
                                onChange={(e) => handleChange("skills", e.target.value)}
                                placeholder="e.g. React, Python, Machine Learning"
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Interests (comma separated)</label>
                            <input
                                type="text"
                                disabled={!editing}
                                value={formData.interests || ""}
                                onChange={(e) => handleChange("interests", e.target.value)}
                                placeholder="e.g. Coding, Blockchain, Finance"
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Achievements</label>
                            <textarea
                                disabled={!editing}
                                value={formData.achievements || ""}
                                onChange={(e) => handleChange("achievements", e.target.value)}
                                rows={3}
                                placeholder="Hackathon wins, papers published, etc."
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        {/* Relationship Status - At Bottom as requested */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Relationship Status</label>
                            <select
                                disabled={!editing}
                                value={formData.relationshipStatus || ""}
                                onChange={(e) => handleChange("relationshipStatus", e.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                            >
                                <option value="">Select Status</option>
                                <option value="Single">Single</option>
                                <option value="Committed">Committed</option>
                                <option value="Interested">Interested</option>
                                <option value="Not Interested">Not Interested</option>
                            </select>
                        </div>
                    </section>

                    {editing && (
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save Profile"}
                            </button>
                            <button
                                onClick={() => {
                                    setFormData(profile || {});
                                    setEditing(false);
                                }}
                                disabled={saving}
                                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedPage>
    );
}
