import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeInspection } from "@/lib/serialize";
import type { InspectionInput, ChecklistResult, ChecklistSnapshotItem } from "@/lib/types";

const VALID_RESULTS: Set<ChecklistResult> = new Set(["Standar", "Tidak Standar"]);

type Params = { params: Promise<{ id: string }> };

/** GET /api/machines/[id]/inspections — daftar log inspeksi untuk satu mesin */
export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;

    const machine = await db.machine.findUnique({ where: { id } });
    if (!machine) {
        return NextResponse.json(
            { error: "Mesin tidak ditemukan." },
            { status: 404 },
        );
    }

    const rows = await db.inspectionLog.findMany({
        where: { machineId: id },
        orderBy: { date: "desc" },
    });

    const inspections = rows.map(serializeInspection);
    return NextResponse.json({ inspections });
}

/** POST /api/machines/[id]/inspections — kirim laporan inspeksi baru */
export async function POST(req: NextRequest, { params }: Params) {
    const { id } = await params;

    const machine = await db.machine.findUnique({ where: { id } });
    if (!machine) {
        return NextResponse.json(
            { error: "Mesin tidak ditemukan." },
            { status: 404 },
        );
    }

    let body: InspectionInput;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Body request tidak valid (bukan JSON)." },
            { status: 400 },
        );
    }

    const { technicianName, checklistResults, notes } = body;

    if (!technicianName || !technicianName.trim()) {
        return NextResponse.json(
            { error: "Nama Teknisi wajib diisi." },
            { status: 400 },
        );
    }

    // Ambil item checklist aktif dari DB untuk validasi & snapshot
    const dbItems = await db.checklistItem.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    if (dbItems.length === 0) {
        return NextResponse.json(
            { error: "Belum ada item checklist terdaftar. Tambahkan item via admin terlebih dahulu." },
            { status: 400 },
        );
    }

    // Bangun keySet item aktif & snapshot
    const activeKeys = new Set(dbItems.map((i: { key: any; }) => i.key));
    const snapshot: ChecklistSnapshotItem[] = dbItems.map((i: { key: any; label: any; }) => ({
        key: i.key,
        label: i.label,
    }));

    // Validasi & sanitasi checklistResults terhadap item aktif
    const cleanResults: Record<string, ChecklistResult> = {};
    if (checklistResults && typeof checklistResults === "object") {
        for (const [key, value] of Object.entries(checklistResults)) {
            if (activeKeys.has(key) && VALID_RESULTS.hase as ChecklistResult)) {
                cleanResults[key] = value as ChecklistResult;
            }
        }
    }

    if (Object.keys(cleanResults).length === 0) {
        return NextResponse.json(
            { error: "Minimal satu item checklist harus diperiksa." },
            { status: 400 },
        );
    }

    const row = await db.inspectionLog.create({
        data: {
            machineId: id,
            technicianName: technicianName.trim(),
            checklistResults: JSON.stringify(cleanResults),
            checklistSnapshot: JSON.stringify(snapshot),
            notes: (notes ?? "").trim(),
            date: new Date(),
        },
    });

    // Update status mesin secara otomatis berdasarkan hasil inspeksi:
    // - Jika ada item "Tidak Standar" → status mesin = "Perbaikan"
    // - Selain itu → "Normal"
    const hasNonStandard = Object.values(cleanResults).includes("Tidak Standar");
    const newStatus = hasNonStandard ? "Perbaikan" : "Normal";

    if (newStatus !== machine.status) {
        await db.machine.update({
            where: { id },
            data: { status: newStatus },
        });
    }

    const inspection = serializeInspection(row);
    return NextResponse.json(
        { inspection, machineStatus: newStatus },
        { status: 201 },
    );
}