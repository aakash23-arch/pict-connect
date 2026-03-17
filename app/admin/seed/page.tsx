"use client";

import { useState } from "react";
import { db } from "../../../lib/firebase";
import ProtectedPage from "../../../components/ProtectedPage";

const CLUBS = [
    { name: "Art Circle", description: "The cultural heart of PICT, organizing unparalleled events in dance, drama, and music." },
    { name: "ADDICTION", description: "PICT's Annual Social Gathering, a showcase of student talent and cultural vibrancy." },
    { name: "Sports", description: "Promoting physical fitness and sportsmanship through inter-college and intra-college tournaments." },
    { name: "Student Welfare & Discipline", description: "Ensuring a conducive and disciplined environment for holistic student development." },
    { name: "National Service Scheme (NSS)", description: "Inculcating social welfare thoughts in students to provide service to society without bias." },
    { name: "PICTOREAL", description: "The official magazine club of PICT, fostering creativity in design, photography, and writing." },
    { name: "Debate Society (DEBSOC)", description: "A platform for students to voice their opinions, hone oratory skills, and engage in intellectual discourse." },
    { name: "TEDx PICT", description: "Organizing independently organized TED events to share ideas worth spreading within the community." },
    { name: "Model United Nations (MUN)", description: "Simulation of the United Nations where students learn about diplomacy, international relations, and the UN." },
    { name: "Game Utopia (Game Dev)", description: "A community for game development enthusiasts to learn, collaborate, and build amazing games." },
    { name: "PICT Coders Club", description: "Fostering a competitive coding culture and helping students excel in algorithmic problem solving." },
    { name: "Social Media Cell", description: "Managing the official social media presence of PICT and keeping the world updated." },
    { name: "Entrepreneurship Development Cell", description: "Inspiring and guiding students to become job creators and future entrepreneurs." },
    { name: "Smart India Hackathon (SIH)", description: "Coordinating participation in the world's biggest open innovation model." },
    { name: "Cyber Security Club", description: "Awareness and hands-on learning in the field of cybersecurity and ethical hacking." },
    { name: "Training and Placement", description: "Facilitating campus placements and preparing students for their professional careers." },
    { name: "Alumni Association", description: "Connecting the strong network of PICT alumni with current students for mentorship and guidance." },
    { name: "Career Guidance Cell", description: "Guiding students on higher studies and various career paths beyond traditional placements." },
    { name: "Impetus & Concepts (INC)", description: "International level project competition and technical exhibition held annually at PICT." },
    { name: "TechFiesta", description: "PICT's International Hackathon promoting innovation and technical excellence." },
    { name: "PASC (ACM)", description: "PICT ACM Student Chapter, organizing technical events, workshops, and the Pulzion festival." },
    { name: "PISB (IEEE)", description: "PICT IEEE Student Branch, known for Credenz and fostering technical growth." },
    { name: "IEEE APS", description: "IEEE Antennas and Propagation Society chapter focusing on electromagnetics and wireless tech." },
    { name: "CSI", description: "Computer Society of India student branch, organizing seminars and technical activities." },
    { name: "ROBOCON", description: "Robotics club dealing with manual and autonomous bot building for national competitions." },
    { name: "Automobile Club", description: "For enthusiasts of automotive engineering and vehicle dynamics." },
    { name: "Universal Human Values (UHV)", description: "Promoting value-based education and holistic human development." },
    { name: "PFISOC (Finance Club)", description: "PICT Finance Society, educating engineers about financial literacy and economics." },
    { name: "FOSS Club", description: "Promoting the use and contribution to Free and Open Source Software." },
    { name: "Astro Club", description: "For astronomy enthusiasts to explore the cosmos and learn about space science." },
    { name: "Ethicraft Club", description: "Focusing on character building and ethical leadership among students." },
    { name: "AWS Cloud Club", description: "Community for learning and exploring Amazon Web Services and cloud computing." },
    { name: "Defense Aspirant Club", description: "Guiding and preparing students aspiring to join the focused defense services." },
    { name: "Startup and Innovation Cell", description: "Nurturing innovative ideas and supporting early-stage startups on campus." },
];

export default function SeedPage() {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        if (!confirm("This will overwrite existing clubs with the same ID. Continue?")) return;

        setLoading(true);
        setStatus("Starting seed...");

        try {
            const batch = db.batch();

            CLUBS.forEach((club) => {
                // Create a slug ID from the name (e.g., "Art Circle" -> "art-circle")
                const id = club.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");

                const ref = db.collection("clubs").doc(id);
                batch.set(ref, {
                    name: club.name,
                    description: club.description,
                    updatedAt: new Date(),
                }, { merge: true });
            });

            await batch.commit();
            setStatus(`Successfully seeded ${CLUBS.length} clubs!`);
        } catch (err: any) {
            console.error(err);
            setStatus("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedPage>
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Database Seeder</h1>
                <p className="mb-4 text-gray-600">
                    This page allows you to populate the Firestore database with the initial list of 34 clubs.
                </p>

                <button
                    onClick={handleSeed}
                    disabled={loading}
                    className="bg-red-600 text-white px-6 py-2 rounded shadow hover:bg-red-700 disabled:opacity-50"
                >
                    {loading ? "Seeding..." : "Seed Clubs DB"}
                </button>

                {status && (
                    <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-300">
                        {status}
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="font-semibold mb-2">Clubs to be added:</h2>
                    <ul className="list-disc pl-5 text-sm h-64 overflow-y-auto border p-2 rounded">
                        {CLUBS.map(c => (
                            <li key={c.name}>
                                <strong>{c.name}</strong>: {c.description}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </ProtectedPage>
    );
}
