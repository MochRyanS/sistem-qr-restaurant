import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { firestore } from "@/lib/firebase";
import { serializeMachine } from "@/lib/serialize";
import type { MachineInput, MachineStatus, MachineSpec } from "@/lib/types";

const VALID_STATUS: MachineStatus[] = ["Normal", "Perbaikan", "Rusak"];
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    const doc = await firestore.collection("machines").doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ machine: serializeMachine(doc) });
}

export async function PUT(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const docRef = firestore.collection("machines").doc(id);
    const existing = await docRef.get();
    if (!existing.exists) return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });

    let body: MachineInput;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
    }

    const { code, name, location, description, specs, imageUrl, status, preventiveDone, preventiveTechnician, preventiveDate, preventiveNotes } = body;

    if (!code?.trim()) return NextResponse.json({ error: "Kode wajib." }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: "Nama wajib." }, { status: 400 });
    if (!location?.trim()) return NextResponse.json({ error: "Lokasi wajib." }, { status: 400 });

    const dupSnap = await firestore.collection("machines").where("code", "==", code.trim()).limit(5).get();
    if (dupSnap.docs.some((d) => d.id !== id))
        return NextResponse.json({ error: "Kode sudah dipakai." }, { status: 409 });

    const cleanSpecs: MachineSpec[] = Array.isArray(specs)
        ? specs.filter((s) => s?.key?.trim()).map((s) => ({ key: s.key.trim(), value: (s.value ?? "").trim() }))
        : [];
    const finalStatus = VALID_STATUS.includes(status) ? status : "Normal";

    await docRef.update({
        code: code.trim(), name: name.trim(), location: location.trim(),
        description: (description ?? "").trim(),
        specs: cleanSpecs, imageUrl: (imageUrl ?? "").trim(),
        status: finalStatus,
        preventiveDone: Boolean(preventiveDone),
        preventiveTechnician: (preventiveTechnician ?? "").trim(),
        preventiveDate: preventiveDate ? Timestamp.fromDate(new Date(preventiveDate)) : Timestamp.now(),
        preventiveNotes: (preventiveNotes ?? "").trim(),
        updatedAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return NextResponse.json({ machine: serializeMachine(doc) });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    const docRef = firestore.collection("machines").doc(id);
    const existing = await docRef.get();
    if (!existing.exists) return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });

    const batch = firestore.batch();
    const inspSnap = await firestore.collection("inspectionLogs").where("machineId", "==", id).get();
    inspSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(docRef);
    await batch.commit();
    return NextResponse.json({ success: true });
}