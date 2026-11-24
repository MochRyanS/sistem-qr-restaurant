import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { firestore } from "@/lib/firebase";
import { serializeMachine } from "@/lib/serialize";
import type { MachineInput, MachineStatus, MachineSpec } from "@/lib/types";

const VALID_STATUS: MachineStatus[] = ["Normal", "Perbaikan", "Rusak"];

export async function GET() {
    const snapshot = await firestore.collection("machines").orderBy("createdAt", "desc").get();
    const machines = snapshot.docs.map(serializeMachine);
    return NextResponse.json({ machines });
}

export async function POST(req: NextRequest) {
    let body: MachineInput;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
    }
    const { code, name, location, specs, imageUrl, status } = body;
    if (!code?.trim()) return NextResponse.json({ error: "Kode wajib diisi." }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
    if (!location?.trim()) return NextResponse.json({ error: "Lokasi wajib diisi." }, { status: 400 });

    const dupSnap = await firestore.collection("machines").where("code", "==", code.trim()).limit(1).get();
    if (!dupSnap.empty) return NextResponse.json({ error: `Kode "${code.trim()}" sudah dipakai.` }, { status: 409 });

    const cleanSpecs: MachineSpec[] = Array.isArray(specs)
        ? specs.filter((s) => s?.key?.trim()).map((s) => ({ key: s.key.trim(), value: (s.value ?? "").trim() }))
        : [];
    const finalStatus = VALID_STATUS.includes(status) ? status : "Normal";
    const now = Timestamp.now();

    const docRef = await firestore.collection("machines").add({
        code: code.trim(), name: name.trim(), location: location.trim(),
        specs: cleanSpecs, imageUrl: (imageUrl ?? "").trim(),
        status: finalStatus, createdAt: now, updatedAt: now,
    });
    const doc = await docRef.get();
    return NextResponse.json({ machine: serializeMachine(doc) }, { status: 201 });
}