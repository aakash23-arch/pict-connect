export interface BatchBadge {
    label: string;
    color: string;
    bgColor: string;
}

export function getBatchBadge(email?: string): BatchBadge | null {
    if (!email) return null;

    const emailLower = email.toLowerCase();

    // Admin / Club / Official
    if (emailLower.includes("admin") || emailLower.includes("principal")) {
        return { label: "OFFICIAL", color: "text-red-700", bgColor: "bg-red-100" };
    }
    if (emailLower.includes("club") || emailLower.includes("acm") || emailLower.includes("csi")) {
        return { label: "CLUB", color: "text-purple-700", bgColor: "bg-purple-100" };
    }

    // Student Pattern: name[year]@ms.pict.edu
    // e.g. aadeshpandece25@ms.pict.edu -> 25 -> FE
    // We look for the last 2 digits before the @
    const match = emailLower.match(/([0-9]{2})@/);

    if (match && match[1]) {
        const yearSuffix = parseInt(match[1]);

        // Logic for Feb 2026 (AY 2025-26)
        // 25 -> FE
        // 24 -> SE
        // 23 -> TE
        // 22 -> BE (Final Year)

        switch (yearSuffix) {
            case 25:
                return { label: "FE", color: "text-green-700", bgColor: "bg-green-100" };
            case 24:
                return { label: "SE", color: "text-blue-700", bgColor: "bg-blue-100" };
            case 23:
                return { label: "TE", color: "text-orange-700", bgColor: "bg-orange-100" };
            case 22:
                return { label: "BE", color: "text-pink-700", bgColor: "bg-pink-100" };
            default:
                if (yearSuffix < 22) {
                    return { label: "ALUMNI", color: "text-gray-700", bgColor: "bg-gray-200" };
                }
                return { label: "STUDENT", color: "text-gray-700", bgColor: "bg-gray-100" };
        }
    }

    return null;
}
