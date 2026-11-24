import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { firestore } from "@/lib/firebase";
import { serializeInspection } from "@/lib/serialize";
import type { InspectionInput, ChecklistResult, ChecklistSnapshotItem } from "@/lib/types";

const VALID_RESULTS: Set<ChecklistResult> = new Set(["Standar", "Tidak Standar"]);
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    const machineDoc = await firestore.collection("machines").doc(id).get();
    if (!machineDoc.exists) return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });

    const snapshot = await firestore.collection("inspectionLogs").where("machineId", "==", id).orderBy("date", "desc").get();
    const inspections = snapshot.docs.map(serializeInspection);
    return NextResponse.json({ inspections });
}

export async function POST(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const machineDoc = await firestore.collection("machines").doc(id).get();
    if (!machineDoc.exists) return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });
    const machineData = machineDoc.data()!;
    const currentStatus = (machineData.status as string) ?? "Normal";

    let body: InspectionInput;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
    }
    const { technicianName, checklistResults, notes } = body;
    if (!technicianName?.trim()) return NextResponse.json({ error: "Nama Teknisi wajib diisi." }, { status: 400 });

    const itemsSnap = await firestore.collection("checklistItems").orderBy("order", "asc").get();
    if (itemsSnap.empty) return NextResponse.json({ error: "Belum ada item checklist." }, { status: 400 });

    const activeKeys = new Set<string>();
    const snapshot: ChecklistSnapshotItem[] = [];
    itemsSnap.docs.forEach((d) => {
        const data = d.data();
        const key = (data.key as string) ?? "";
        const label = (data.label as string) ?? "";
        if (key) { activeKeys.add(key); snapshot.push({ key, label }); }
    });

    const cleanResults: Record<string, ChecklistResult> = {};
    if (checklistResults && typeof checklistResults === "object") {
        for (const [key, value] of Object.entries(checklistResults)) {
            if (activeKeys.has(key) && VALID_RESULTS.has(value as ChecklistResult)) {
                cleanResults[key] = value as ChecklistResult;
            }
        }
    }
    if (Object.keys(cleanResults).length === 0)
        return NextResponse.json({ error: "Minimal satu item harus diperiksa." }, { status: 400 });

    const now = Timestamp.now();
    const docRef = await firestore.collection("inspectionLogs").add({
        machineId: id, technicianName: technicianName.trim(),
        checklistResults: cleanResults, checklistSnapshot: snapshot,
        notes: (notes ?? "").trim(), date: now, createdAt: now,
    });

    const hasNonStandard = Object.values(cleanResults).includes("Tidak Standar");
    const newStatus = hasNonStandard ? "Perbaikan" : "Normal";
    if (newStatus !== currentStatus) {
        await firestore.collection("machines").doc(id).update({ status: newStatus, updatedAt: Timestamp.now() });
    }

    const doc = await docRef.get();
    return NextResponse.json({ inspection: serializeInspection(doc), machineStatus: newStatus }, { status: 201 });
}