import type {
    Machine,
    InspectionLog,
    MachineInput,
    InspectionInput,
    MachineStatus,
    ChecklistItem,
    ChecklistItemInput,
} from "@/lib/types";

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let message = `Terjadi kesalahan (HTTP ${res.status}).`;
        try {
            const data = await res.json();
            if (data?.error) message = data.error;
        } catch {
            // ignore parse error
        }
        throw new Error(message);
    }
    return res.json() as Promise<T>;
}

/** Ambil daftar semua mesin */
export async function fetchMachines(): Promise<Machine[]> {
    const res = await fetch("/api/machines", { cache: "no-store" });
    const data = await handle<{ machines: Machine[] }>(res);
    return data.machines;
}

/** Ambil detail satu mesin */
export async function fetchMachine(id: string): Promise<Machine> {
    const res = await fetch(`/api/machines/${id}`, { cache: "no-store" });
    const data = await handle<{ machine: Machine }>(res);
    return data.machine;
}

/** Buat mesin baru */
export async function createMachine(input: MachineInput): Promise<Machine> {
    const res = await fetch("/api/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const data = await handle<{ machine: Machine }>(res);
    return data.machine;
}

/** Update mesin (Dynamic QR — data berubah tanpa cetak ulang QR) */
export async function updateMachine(
    id: string,
    input: MachineInput,
): Promise<Machine> {
    const res = await fetch(`/api/machines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const data = await handle<{ machine: Machine }>(res);
    return data.machine;
}

/** Hapus mesin */
export async function deleteMachine(id: string): Promise<void> {
    const res = await fetch(`/api/machines/${id}`, { method: "DELETE" });
    await handle<{ success: boolean }>(res);
}

/** Ambil daftar log inspeksi untuk satu mesin */
export async function fetchInspections(machineId: string): Promise<InspectionLog[]> {
    const res = await fetch(`/api/machines/${machineId}/inspections`, {
        cache: "no-store",
    });
    const data = await handle<{ inspections: InspectionLog[] }>(res);
    return data.inspections;
}

/** Kirim laporan inspeksi baru */
export async function submitInspection(
    machineId: string,
    input: InspectionInput,
): Promise<{ inspection: InspectionLog; machineStatus: MachineStatus }> {
    const res = await fetch(`/api/machines/${machineId}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const data = await handle<{
        inspection: InspectionLog;
        machineStatus: MachineStatus;
    }>(res);
    return data;
}

// ============================================================
// Checklist Items (konfigurasi global)
// ============================================================

/** Ambil daftar semua item checklist */
export async function fetchChecklistItems(): Promise<ChecklistItem[]> {
    const res = await fetch("/api/checklist-items", { cache: "no-store" });
    const data = await handle<{ items: ChecklistItem[] }>(res);
    return data.items;
}

/** Tambah item checklist baru */
export async function createChecklistItem(
    input: ChecklistItemInput,
): Promise<ChecklistItem> {
    const res = await fetch("/api/checklist-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const data = await handle<{ item: ChecklistItem }>(res);
    return data.item;
}

/** Update label item checklist */
export async function updateChecklistItem(
    id: string,
    input: ChecklistItemInput,
): Promise<ChecklistItem> {
    const res = await fetch(`/api/checklist-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const data = await handle<{ item: ChecklistItem }>(res);
    return data.item;
}

/** Hapus item checklist */
export async function deleteChecklistItem(id: string): Promise<void> {
    const res = await fetch(`/api/checklist-items/${id}`, { method: "DELETE" });
    await handle<{ success: boolean }>(res);
}