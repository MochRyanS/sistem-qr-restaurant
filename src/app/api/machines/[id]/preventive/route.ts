import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { firestore } from "@/lib/firebase";
import { serializePreventiveLog } from "@/lib/serialize";
import type { PreventiveInput } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    const machineDoc = await firestore.collection("machines").doc(id).get();
    if (!machineDoc.exists) {
        return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });
    }
    const snapshot = await firestore
        .collection("preventiveLogs")
        .where("machineId", "==", id)
        .orderBy("date", "desc")
        .get();
    const logs = snapshot.docs.map(serializePreventiveLog);
    return NextResponse.json({ logs });
}

export async function POST(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const machineDoc = await firestore.collection("machines").doc(id).get();
    if (!machineDoc.exists) {
        return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });
    }

    let body: PreventiveInput;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
    }

    const { technicianName, date, notes } = body;
    if (!technicianName?.trim()) return NextResponse.json({ error: "Nama Teknisi wajib." }, { status: 400 });
    if (!date) return NextResponse.json({ error: "Tanggal wajib." }, { status: 400 });

    const now = Timestamp.now();
    const docRef = await firestore.collection("preventiveLogs").add({
        machineId: id,
        technicianName: technicianName.trim(),
        date: Timestamp.fromDate(new Date(date)),
        notes: (notes ?? "").trim(),
        createdAt: now,
    });

    // Sync latest preventive ke machine doc (untuk QR scan)
    await firestore.collection("machines").doc(id).update({
        preventiveDone: true,
        preventiveTechnician: technicianName.trim(),
        preventiveDate: Timestamp.fromDate(new Date(date)),
        preventiveNotes: (notes ?? "").trim(),
        updatedAt: now,
    });

    const doc = await docRef.get();
    return NextResponse.json({ log: serializePreventiveLog(doc) }, { status: 201 });
}