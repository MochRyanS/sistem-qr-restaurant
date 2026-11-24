import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { firestore } from "@/lib/firebase";
import { serializeChecklistItem } from "@/lib/serialize";
import { slugifyKey, type ChecklistItemInput } from "@/lib/types";

export async function GET() {
    const snapshot = await firestore.collection("checklistItems").orderBy("order", "asc").get();
    const items = snapshot.docs.map(serializeChecklistItem);
    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    let body: ChecklistItemInput;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
    }
    const { label } = body;
    if (!label?.trim()) return NextResponse.json({ error: "Nama item wajib diisi." }, { status: 400 });

    const cleanLabel = label.trim();
    let baseKey = slugifyKey(cleanLabel);
    if (!baseKey) baseKey = "item";
    let key = baseKey;
    let suffix = 1;
    while (true) {
        const dupSnap = await firestore.collection("checklistItems").where("key", "==", key).limit(1).get();
        if (dupSnap.empty) break;
        key = `${baseKey}-${suffix}`;
        suffix++;
    }

    const orderSnap = await firestore.collection("checklistItems").orderBy("order", "desc").limit(1).get();
    const nextOrder = orderSnap.empty ? 1 : ((orderSnap.docs[0].data().order as number) ?? 0) + 1;

    const now = Timestamp.now();
    const docRef = await firestore.collection("checklistItems").add({
        key, label: cleanLabel, order: nextOrder, createdAt: now, updatedAt: now,
    });
    const doc = await docRef.get();
    return NextResponse.json({ item: serializeChecklistItem(doc) }, { status: 201 });
}