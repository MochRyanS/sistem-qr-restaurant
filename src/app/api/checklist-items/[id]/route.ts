import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { firestore } from "@/lib/firebase";
import { serializeChecklistItem } from "@/lib/serialize";
import type { ChecklistItemInput } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const docRef = firestore.collection("checklistItems").doc(id);
    const existing = await docRef.get();
    if (!existing.exists) return NextResponse.json({ error: "Item tidak ditemukan." }, { status: 404 });

    let body: ChecklistItemInput;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
    }
    const { label } = body;
    if (!label?.trim()) return NextResponse.json({ error: "Nama item wajib diisi." }, { status: 400 });

    await docRef.update({ label: label.trim(), updatedAt: Timestamp.now() });
    const doc = await docRef.get();
    return NextResponse.json({ item: serializeChecklistItem(doc) });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    const docRef = firestore.collection("checklistItems").doc(id);
    const existing = await docRef.get();
    if (!existing.exists) return NextResponse.json({ error: "Item tidak ditemukan." }, { status: 404 });
    await docRef.delete();
    return NextResponse.json({ success: true });
}