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
    code: string; // Nomor/Kode Aset Unik
    name: string;
    location: string;
    specs: MachineSpec[]; // Array spesifikasi {key, value}
    imageUrl: string;
    status: MachineStatus;
    createdAt: string;
    updatedAt: string;
}

/** Payload untuk membuat/mengedit mesin */
export interface MachineInput {
    code: string;
    name: string;
    location: string;
    specs: MachineSpec[];
    imageUrl: string;
    status: MachineStatus;
}

/**
 * Hasil pemeriksaan per item checklist (format biner sesuai PDF
 * "FORM CHECKLIST EQUIPMENT SAFARI BENTO": Standar / Tidak Standar).
 */
export type ChecklistResult = "Standar" | "Tidak Standar";

/** Item checklist inspeksi (konfigurasi global, disimpan di DB) */
export interface ChecklistItem {
    id: string;
    key: string; // slug stabil, immutable
    label: string; // nama tampilan, dapat diedit
    order: number;
    createdAt: string;
    updatedAt: string;
}

/** Payload untuk membuat item checklist */
export interface ChecklistItemInput {
    label: string;
}

/** Mapping hasil checklist: { itemKey: result } */
export type ChecklistResults = Record<string, ChecklistResult>;

/** Snapshot item checklist saat inspeksi dilakukan */
export interface ChecklistSnapshotItem {
    key: string;
    label: string;
}

/** Entitas Log Inspeksi */
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

/** Payload untuk membuat inspeksi baru */
export interface InspectionInput {
    technicianName: string;
    notes: string;
    /** Optional: tanggal inspeksi (default: now) */
    date?: string;
}

/** Pilihan hasil checklist untuk radio/tombol */
export const CHECKLIST_RESULT_OPTIONS: { value: ChecklistResult; label: string }[] = [
    { value: "Standar", label: "Standar" },
    { value: "Tidak Standar", label: "Tidak Standar" },
];

/** Helper: ubah label menjadi slug stabil (key) */
export function slugifyKey(label: string): string {
    return label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "") // hapus karakter non-alfanumerik
        .replace(/\s+/g, "-") // spasi → tanda hubung
        .replace(/-+/g, "-") // gabungkan tanda hubung beruntun
        .replace(/^-|-$/g, ""); // hapus tanda hubung di ujung
}