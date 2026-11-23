import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeChecklistItem } from "@/lib/serialize";
import type { ChecklistItemInput } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

/** PUT /api/checklist-items/[id] — update label item (key tetap stabil) */
export async function PUT(req: NextRequest, { params }: Params) {
    const { id } = await params;

    const existing = await db.checklistItem.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json(
            { error: "Item checklist tidak ditemukan." },
            { status: 404 },
        );
    }

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

    const row = await db.checklistItem.update({
        where: { id },
        data: { label: label.trim() },
    });

    return NextResponse.json({ item: serializeChecklistItem(row) });
}

/** DELETE /api/checklist-items/[id] — hapus item checklist */
export async function DELETE(_req: NextRequest, { params }: Params) {
    const { id } = await params;

    const existing = await db.checklistItem.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json(
            { error: "Item checklist tidak ditemukan." },
            { status: 404 },
        );
    }

    await db.checklistItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
}