import type {
    Machine,
    InspectionLog,
    MachineSpec,
    ChecklistResults,
    ChecklistItem,
    ChecklistSnapshotItem,
} from "@/lib/types";

/** Tipe structur untuk Firestore document (kompatibel semua versi firebase-admin). */
interface FirestoreDoc {
    id: string;
    exists: boolean;
    data: () => Record<string, unknown> | undefined;
}

/** Konversi nilai tanggal Firestore/Date/string ke ISO string. */
function toISO(value: unknown): string {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null && "toDate" in value) {
        const toDate = (value as { toDate: () => Date }).toDate;
        return toDate.call(value).toISOString();
    }
    return new Date().toISOString();
}

/** Serialisasi Firestore doc → tipe domain Machine. */
export function serializeMachine(doc: FirestoreDoc): Machine {
    const data = doc.data() ?? {};

    let specs: MachineSpec[] = [];
    if (Array.isArray(data.specs)) {
        specs = (data.specs as unknown[])
            .filter(
                (s) =>
                    s && typeof s === "object" &&
                    typeof (s as Record<string, unknown>).key === "string" &&
                    typeof (s as Record<string, unknown>).value === "string",
            ) as MachineSpec[];
    }

    return {
        id: doc.id,
        code: (data.code as string) ?? "",
        name: (data.name as string) ?? "",
        location: (data.location as string) ?? "",
        specs,
        imageUrl: (data.imageUrl as string) ?? "",
        status: (data.status as Machine["status"]) ?? "Normal",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
    };
}

/** Serialisasi Firestore doc → tipe domain InspectionLog. */
export function serializeInspection(doc: FirestoreDoc): InspectionLog {
    const data = doc.data() ?? {};

    let checklistResults: ChecklistResults = {};
    if (
        data.checklistResults &&
        typeof data.checklistResults === "object" &&
        !Array.isArray(data.checklistResults)
    ) {
        checklistResults = data.checklistResults as ChecklistResults;
    }

    let checklistSnapshot: ChecklistSnapshotItem[] = [];
    if (Array.isArray(data.checklistSnapshot)) {
        checklistSnapshot = (data.checklistSnapshot as unknown[])
            .filter(
                (s) =>
                    s && typeof s === "object" &&
                    typeof (s as Record<string, unknown>).key === "string" &&
                    typeof (s as Record<string, unknown>).label === "string",
            ) as ChecklistSnapshotItem[];
    }

    return {
        id: doc.id,
        machineId: (data.machineId as string) ?? "",
        date: toISO(data.date),
        technicianName: (data.technicianName as string) ?? "",
        checklistResults,
        checklistSnapshot,
        notes: (data.notes as string) ?? "",
        createdAt: toISO(data.createdAt),
    };
}

/** Serialisasi Firestore doc → tipe domain ChecklistItem. */
export function serializeChecklistItem(doc: FirestoreDoc): ChecklistItem {
    const data = doc.data() ?? {};

    return {
        id: doc.id,
        key: (data.key as string) ?? "",
        label: (data.label as string) ?? "",
        order: (data.order as number) ?? 0,
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
    };
}

/** Format tanggal ke format Indonesia: "2 Januari 2025, 09:30 WIB" */
export function formatDateTimeID(iso: string): string {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    }).format(date);
}

/** Format tanggal singkat: "2 Jan 2025" */
export function formatDateID(iso: string): string {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(date);
}