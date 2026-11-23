import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeChecklistItem } from "@/lib/serialize";
import { slugifyKey, type ChecklistItemInput } from "@/lib/types";

/** GET /api/checklist-items — daftar semua item checklist (urut) */
export async function GET() {
    const rows = await db.checklistItem.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    const items = rows.map(serializeChecklistItem);
    return NextResponse.json({ items });
}

/** POST /api/checklist-items — tambah item checklist baru */
export async function POST(req: NextRequest) {
    let body: ChecklistItemInput;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Body request tidak valid (bukan JSON)." },
            { status: 400 },
        );
    }

    const { label } = body;
    if (!label || !label.trim()) {
        return NextResponse.json(
            { error: "Nama item checklist wajib diisi." },
            { status: 400 },
        );
    }

    const cleanLabel = label.trim();

    // Generate key stabil dari label; pastikan unik
    let baseKey = slugifyKey(cleanLabel);
    if (!baseKey) baseKey = "item";
    let key = baseKey;
    let suffix = 1;
    // Cari key yang belum dipakai
    while (await db.checklistItem.findUnique({ where: { key } })) {
        key = `${baseKey}-${suffix}`;
        suffix++;
    }

    // order = max(existing order) + 1
    const maxOrderRow = await db.checklistItem.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
    });
    const nextOrder = (maxOrderRow?.order ?? 0) + 1;

    const row = await db.checklistItem.create({
        data: {
            key,
            label: cleanLabel,
            order: nextOrder,
        },
    });

    return NextResponse.json({ item: serializeChecklistItem(row) }, { status: 201 });
}