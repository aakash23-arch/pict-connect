"use client";

import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { db } from "../../lib/firebase";
import { useUser } from "../../components/UserContext";
import firebase from "firebase/compat/app";
import { ACADEMIC_EVENTS } from "../../lib/academic-events";

interface Event {
    id: string;
    title: string;
    description: string;
    date: firebase.firestore.Timestamp;
    venue: string;
    organizer: string;
    registrationLink?: string;
    attendees: string[];
}

export default function EventsPage() {
    const { user } = useUser();
    const [events, setEvents] = useState<Event[]>(ACADEMIC_EVENTS);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<"list" | "calendar">("list");

    // Admin/Organizer State
    const [isOrganizer, setIsOrganizer] = useState(false); // In real app, check role
    const [showCreate, setShowCreate] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        date: "",
        venue: "",
        registrationLink: "",
    });

    useEffect(() => {
        // Simple check: if email contains 'admin' or 'club', allow create
        if (user?.email && (user.email.includes("admin") || user.email.includes("club"))) {
            setIsOrganizer(true);
        }

        const unsubscribe = db
            .collection("events")
            .orderBy("date", "asc")
            .onSnapshot(
                (snapshot: firebase.firestore.QuerySnapshot) => {
                    const firestoreEvents = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Event[];

                    // Merge and sort
                    const allEvents = [...ACADEMIC_EVENTS, ...firestoreEvents].sort((a, b) =>
                        a.date.toMillis() - b.date.toMillis()
                    );

                    setEvents(allEvents);
                },
                (error: firebase.firestore.FirestoreError) => {
                    console.error("Error fetching events:", error);
                    // Even if firestore fails, we have valid static events
                }
            );

        return () => unsubscribe();
    }, [user]);

    const handleCreateEvent = async () => {
        if (!user?.email || !newEvent.title || !newEvent.date) return;

        try {
            await db.collection("events").add({
                ...newEvent,
                date: firebase.firestore.Timestamp.fromDate(new Date(newEvent.date)),
                organizer: user.email.split("@")[0], // Simplified
                attendees: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            setShowCreate(false);
            setNewEvent({ title: "", description: "", date: "", venue: "", registrationLink: "" });
        } catch (error) {
            console.error("Error creating event", error);
            alert("Failed to create event.");
        }
    };

    const handleRSVP = async (event: Event) => {
        if (!user?.email) return;

        const eventRef = db.collection("events").doc(event.id);
        const isAttending = event.attendees.includes(user.email);
        let newAttendees = [...event.attendees];

        if (isAttending) {
            newAttendees = newAttendees.filter((e) => e !== user.email);
        } else {
            newAttendees.push(user.email);
        }

        try {
            await eventRef.update({ attendees: newAttendees });
        } catch (error) {
            console.error("Error updating RSVP", error);
        }
    };

    return (
        <ProtectedPage>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-500">Events & Workshops</h1>
                        <p className="text-sm text-gray-600">
                            Upcoming seminars, club activities, and fests.
                        </p>
                    </div>
                    {isOrganizer && (
                        <button
                            onClick={() => setShowCreate(!showCreate)}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                        >
                            {showCreate ? "Cancel" : "Create Event"}
                        </button>
                    )}
                </div>

                {/* Create Event Form */}
                {showCreate && (
                    <div className="rounded-lg bg-white p-6 shadow ring-1 ring-gray-200">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Create New Event</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                type="text"
                                placeholder="Event Title"
                                className="rounded border border-gray-300 p-2 text-sm"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            />
                            <input
                                type="datetime-local"
                                className="rounded border border-gray-300 p-2 text-sm"
                                value={newEvent.date}
                                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Venue"
                                className="rounded border border-gray-300 p-2 text-sm"
                                value={newEvent.venue}
                                onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                            />
                            <input
                                type="url"
                                placeholder="Registration Link (Optional)"
                                className="rounded border border-gray-300 p-2 text-sm"
                                value={newEvent.registrationLink}
                                onChange={(e) => setNewEvent({ ...newEvent, registrationLink: e.target.value })}
                            />
                            <textarea
                                placeholder="Description"
                                className="col-span-2 rounded border border-gray-300 p-2 text-sm"
                                rows={3}
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            />
                            <button
                                onClick={handleCreateEvent}
                                className="col-span-2 rounded bg-gray-900 py-2 text-sm font-medium text-white hover:bg-black"
                            >
                                Publish Event
                            </button>
                        </div>
                    </div>
                )}

                {/* View Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setView("list")}
                        className={`rounded px-3 py-1 text-sm ${view === "list" ? "bg-gray-200 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                        List View
                    </button>
                    <button
                        onClick={() => setView("calendar")}
                        className={`rounded px-3 py-1 text-sm ${view === "calendar" ? "bg-gray-200 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                        Calendar View
                    </button>
                </div>

                {/* Events List */}
                {loading && <p className="text-sm text-gray-500">Loading events...</p>}

                {!loading && events.length === 0 && (
                    <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
                        No upcoming events found.
                    </div>
                )}

                {view === "list" ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {events.map((event) => {
                            const isAttending = user?.email && event.attendees.includes(user.email);
                            return (
                                <div key={event.id} className="flex flex-col justify-between rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md">
                                    <div>
                                        <div className="mb-2 flex items-start justify-between">
                                            <div>
                                                <p className="text-xs font-bold uppercase text-red-600">
                                                    {event.date.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                                                <h3 className="mt-1 text-lg font-bold text-gray-900">{event.title}</h3>
                                            </div>
                                            <span className="rounded bg-gray-100 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-600">
                                                {event.venue}
                                            </span>
                                        </div>

                                        <p className="mb-4 text-sm text-gray-600 line-clamp-3">{event.description}</p>

                                        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                                            <span>Organized by {event.organizer}</span>
                                            <span>•</span>
                                            <span>{event.attendees.length} attending</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRSVP(event)}
                                            className={`flex-1 rounded py-2 text-sm font-medium transition ${isAttending
                                                ? "bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100"
                                                : "bg-gray-900 text-white hover:bg-black"
                                                }`}
                                        >
                                            {isAttending ? "✓ Going" : "RSVP"}
                                        </button>
                                        {event.registrationLink && (
                                            <a
                                                href={event.registrationLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 rounded border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Details ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <CalendarView events={events} />
                )}
            </div>
        </ProtectedPage>
    );
}

function CalendarView({ events }: { events: Event[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: startDay }, (_, i) => i);

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    return (
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                    {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="rounded p-1 hover:bg-gray-100">←</button>
                    <button onClick={() => setCurrentDate(new Date())} className="rounded px-2 text-sm text-red-600 hover:bg-red-50">Today</button>
                    <button onClick={nextMonth} className="rounded p-1 hover:bg-gray-100">→</button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px rounded-lg bg-gray-200 border border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                        {day}
                    </div>
                ))}

                {blanks.map(i => (
                    <div key={`blank-${i}`} className="bg-white h-24 sm:h-32" />
                ))}

                {days.map(day => {
                    const date = new Date(year, month, day);
                    const isToday =
                        date.getDate() === today.getDate() &&
                        date.getMonth() === today.getMonth() &&
                        date.getFullYear() === today.getFullYear();

                    const daysEvents = events.filter(e => {
                        const eDate = e.date.toDate();
                        return (
                            eDate.getDate() === day &&
                            eDate.getMonth() === month &&
                            eDate.getFullYear() === year
                        );
                    });

                    return (
                        <div key={day} className={`group relative flex flex-col justify-between bg-white p-2 h-24 sm:h-32 hover:bg-gray-50 ${isToday ? 'bg-blue-50' : ''}`}>
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-red-600 text-white' : 'text-gray-700'}`}>
                                {day}
                            </span>

                            <div className="mt-1 flex-1 overflow-y-auto space-y-1">
                                {daysEvents.map(e => (
                                    <div key={e.id} className="rounded bg-red-100 px-1 py-0.5 text-[10px] sm:text-xs font-medium text-red-800 truncate" title={e.title}>
                                        {e.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
