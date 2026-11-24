import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { firestore } from "@/lib/firebase";
import { serializeInspection } from "@/lib/serialize";
import type { InspectionInput } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    const machineDoc = await firestore.collection("machines").doc(id).get();
    if (!machineDoc.exists) {
        return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });
    }
    const snapshot = await firestore
        .collection("inspectionLogs")
        .where("machineId", "==", id)
        .orderBy("date", "desc")
        .get();
    const inspections = snapshot.docs.map(serializeInspection);
    return NextResponse.json({ inspections });
}

export async function POST(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const machineDoc = await firestore.collection("machines").doc(id).get();
    if (!machineDoc.exists) {
        return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });
    }
    let body: InspectionInput;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
    }
    const { technicianName, notes, date } = body;
    if (!technicianName || !technicianName.trim()) {
        return NextResponse.json({ error: "Nama Teknisi wajib diisi." }, { status: 400 });
    }
    const inspectionDate = date ? Timestamp.fromDate(new Date(date)) : Timestamp.now();
    const now = Timestamp.now();
    const docRef = await firestore.collection("inspectionLogs").add({
        machineId: id,
        technicianName: technicianName.trim(),
        notes: (notes ?? "").trim(),
        date: inspectionDate,
        createdAt: now,
    });
    const doc = await docRef.get();
    const inspection = serializeInspection(doc);
    return NextResponse.json({ inspection }, { status: 201 });
}