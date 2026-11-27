import type {
    Machine, InspectionLog, MachineSpec,
    ChecklistResults, ChecklistItem, ChecklistSnapshotItem,
} from "@/lib/types";
import type { Timestamp, DocumentSnapshot } from "firebase-admin/firestore";

function toISO(value: unknown): string {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null && "toDate" in value) {
        return (value as Timestamp).toDate().toISOString();
    }
    return new Date().toISOString();
}

interface MachineDocData {
    code?: string;
    name?: string;
    location?: string;
    description?: string;
    specs?: unknown;
    imageUrl?: string;
    status?: string;
    preventiveDone?: boolean;
    preventiveTechnician?: string;
    preventiveDate?: unknown;
    preventiveNotes?: string;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export function serializeMachine(doc: DocumentSnapshot): Machine {
    const data = doc.data() as MachineDocData | undefined;
    let specs: MachineSpec[] = [];
    if (Array.isArray(data?.specs)) {
        specs = (data!.specs as unknown[])
            .filter((s) => s && typeof s === "object" &&
                typeof (s as MachineSpec).key === "string" &&
                typeof (s as MachineSpec).value === "string",
            ) as MachineSpec[];
    }
    return {
        id: doc.id,
        code: data?.code ?? "",
        name: data?.name ?? "",
        location: data?.location ?? "",
        description: data?.description ?? "",
        specs,
        imageUrl: data?.imageUrl ?? "",
        status: (data?.status as Machine["status"]) ?? "Normal",
        preventiveDone: data?.preventiveDone ?? false,
        preventiveTechnician: data?.preventiveTechnician ?? "",
        preventiveDate: toISO(data?.preventiveDate),
        preventiveNotes: data?.preventiveNotes ?? "",
        createdAt: toISO(data?.createdAt),
        updatedAt: toISO(data?.updatedAt),
    };
}

interface InspectionDocData {
    machineId?: string;
    technicianName?: string;
    checklistResults?: unknown;
    checklistSnapshot?: unknown;
    notes?: string;
    date?: unknown;
    createdAt?: unknown;
}

export function serializeInspection(doc: DocumentSnapshot): InspectionLog {
    const data = doc.data() as InspectionDocData | undefined;
    let checklistResults: ChecklistResults = {};
    if (data?.checklistResults && typeof data.checklistResults === "object" && !Array.isArray(data.checklistResults)) {
        checklistResults = data.checklistResults as ChecklistResults;
    }
    let checklistSnapshot: ChecklistSnapshotItem[] = [];
    if (Array.isArray(data?.checklistSnapshot)) {
        checklistSnapshot = (data!.checklistSnapshot as unknown[])
            .filter((s) => s && typeof s === "object" &&
                typeof (s as ChecklistSnapshotItem).key === "string" &&
                typeof (s as ChecklistSnapshotItem).label === "string",
            ) as ChecklistSnapshotItem[];
    }
    return {
        id: doc.id,
        machineId: data?.machineId ?? "",
        date: toISO(data?.date),
        technicianName: data?.technicianName ?? "",
        checklistResults,
        checklistSnapshot,
        notes: data?.notes ?? "",
        createdAt: toISO(data?.createdAt),
    };
}

interface ChecklistItemDocData {
    key?: string;
    label?: string;
    order?: number;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export function serializeChecklistItem(doc: DocumentSnapshot): ChecklistItem {
    const data = doc.data() as ChecklistItemDocData | undefined;
    return {
        id: doc.id,
        key: data?.key ?? "",
        label: data?.label ?? "",
        order: data?.order ?? 0,
        createdAt: toISO(data?.createdAt),
        updatedAt: toISO(data?.updatedAt),
    };
}

export function formatDateTimeID(iso: string): string {
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
}

export function formatDateID(iso: string): string {
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
}