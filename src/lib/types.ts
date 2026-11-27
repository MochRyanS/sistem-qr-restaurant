// ============================================================
// Type Definitions untuk Sistem Manajemen Aset & Inspeksi Mesin
// ============================================================

/** Status operasional mesin */
export type MachineStatus = "Normal" | "Perbaikan" | "Rusak";

/** Item spesifikasi mesin dalam format key-value */
export interface MachineSpec {
    key: string;
    value: string;
}

/** Entitas Mesin */
export interface Machine {
    id: string;
    code: string;
    name: string;
    location: string;
    description: string;
    specs: MachineSpec[];
    imageUrl: string;
    status: MachineStatus;
    preventiveDone: boolean;
    createdAt: string;
    updatedAt: string;
}

/** Payload untuk membuat/mengedit mesin */
export interface MachineInput {
    code: string;
    name: string;
    location: string;
    description: string;
    specs: MachineSpec[];
    imageUrl: string;
    status: MachineStatus;
    preventiveDone: boolean;
}

export type ChecklistResult = "Standar" | "Tidak Standar";

export interface ChecklistItem {
    id: string;
    key: string;
    label: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface ChecklistItemInput {
    label: string;
}

export type ChecklistResults = Record<string, ChecklistResult>;

export interface ChecklistSnapshotItem {
    key: string;
    label: string;
}

export interface InspectionLog {
    id: string;
    machineId: string;
    date: string;
    technicianName: string;
    checklistResults: ChecklistResults;
    checklistSnapshot: ChecklistSnapshotItem[];
    notes: string;
    createdAt: string;
}

export interface InspectionInput {
    technicianName: string;
    notes: string;
    date?: string;
}

export const CHECKLIST_RESULT_OPTIONS: { value: ChecklistResult; label: string }[] = [
    { value: "Standar", label: "Standar" },
    { value: "Tidak Standar", label: "Tidak Standar" },
];

export function slugifyKey(label: string): string {
    return label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}