import type {
    Machine,
    InspectionLog,
    MachineSpec,
    ChecklistResults,
    ChecklistItem,
    ChecklistSnapshotItem,
} from "@/lib/types";

/**
 * Helper serialisasi dari record Prisma (yang menyimpan specs & checklistResults
 * sebagai JSON string) menjadi tipe domain yang dikonsumsi frontend.
 */
export function serializeMachine(row: {
    id: string;
    code: string;
    name: string;
    location: string;
    specs: string;
    imageUrl: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}): Machine {
    let specs: MachineSpec[] = [];
    try {
        const parsed = JSON.parse(row.specs);
        if (Array.isArray(parsed)) {
            specs = parsed.filter(
                (s) => s && typeof s.key === "string" && typeof s.value === "string",
            );
        }
    } catch {
        specs = [];
    }

    return {
        id: row.id,
        code: row.code,
        name: row.name,
        location: row.location,
        specs,
        imageUrl: row.imageUrl,
        status: (row.status as Machine["status"]) ?? "Normal",
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export function serializeInspection(row: {
    id: string;
    machineId: string;
    date: Date;
    technicianName: string;
    checklistResults: string;
    checklistSnapshot: string;
    notes: string;
    createdAt: Date;
}): InspectionLog {
    let checklistResults: ChecklistResults = {};
    try {
        const parsed = JSON.parse(row.checklistResults);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            checklistResults = parsed as ChecklistResults;
        }
    } catch {
        checklistResults = {};
    }

    let checklistSnapshot: ChecklistSnapshotItem[] = [];
    try {
        const parsed = JSON.parse(row.checklistSnapshot);
        if (Array.isArray(parsed)) {
            checklistSnapshot = parsed.filter(
                (s) => s && typeof s.key === "string" && typeof s.label === "string",
            );
        }
    } catch {
        checklistSnapshot = [];
    }

    return {
        id: row.id,
        machineId: row.machineId,
        date: row.date.toISOString(),
        technicianName: row.technicianName,
        checklistResults,
        checklistSnapshot,
        notes: row.notes,
        createdAt: row.createdAt.toISOString(),
    };
}

export function serializeChecklistItem(row: {
    id: string;
    key: string;
    label: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}): ChecklistItem {
    return {
        id: row.id,
        key: row.key,
        label: row.label,
        order: row.order,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
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