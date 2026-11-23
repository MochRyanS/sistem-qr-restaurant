import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeMachine } from "@/lib/serialize";
import type { MachineInput, MachineStatus } from "@/lib/types";

const VALID_STATUS: Set<MachineStatus> = new Set(["Normal", "Perbaikan", "Rusak"]);

type Params = { params: Promise<{ id: string }> };

/** GET /api/machines/[id] — detail satu mesin */
export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    const row = await db.machine.findUnique({ where: { id } });
    if (!row) {
        return NextResponse.json(
            { error: "Mesin tidak ditemukan." },
            { status: 404 },
        );
    }
    return NextResponse.json({ machine: serializeMachine(row) });
}

/** PUT /api/machines/[id] — update data mesin (Dynamic QR: data berubah, QR tetap) */
export async function PUT(req: NextRequest, { params }: Params) {
    const { id } = await params;

    const existing = await db.machine.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json(
            { error: "Mesin tidak ditemukan." },
            { status: 404 },
        );
    }

    let body: MachineInput;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Body request tidak valid (bukan JSON)." },
            { status: 400 },
        );
    }

    const { code, name, location, specs, imageUrl, status } = body;

    if (!code || !code.trim()) {
        return NextResponse.json(
            { error: "Kode/Nomor Aset wajib diisi." },
            { status: 400 },
        );
    }
    if (!name || !name.trim()) {
        return NextResponse.json(
            { error: "Nama Mesin wajib diisi." },
            { status: 400 },
        );
    }
    if (!location || !location.trim()) {
        return NextResponse.json(
            { error: "Lokasi Penempatan wajib diisi." },
            { status: 400 },
        );
    }

    // Cek duplikasi kode aset pada mesin lain
    const dup = await db.machine.findUnique({ where: { code: code.trim() } });
    if (dup && dup.id !== id) {
        return NextResponse.json(
            { error: `Kode aset "${code.trim()}" sudah digunakan mesin lain.` },
            { status: 409 },
        );
    }

    const cleanSpecs = Array.isArray(specs)
        ? specs
            .filter((s) => s && s.key && s.key.trim())
            .map((s) => ({ key: s.key.trim(), value: (s.value ?? "").trim() }))
        : [];

    const finalStatus = VALID_STATUS.has(status) ? status : "Normal";

    const row = await db.machine.update({
        where: { id },
        data: {
            code: code.trim(),
            name: name.trim(),
            location: location.trim(),
            specs: JSON.stringify(cleanSpecs),
            imageUrl: (imageUrl ?? "").trim(),
            status: finalStatus,
        },
    });

    return NextResponse.json({ machine: serializeMachine(row) });
}

/** DELETE /api/machines/[id] — hapus mesin (beserta seluruh log inspeksi) */
export async function DELETE(_req: NextRequest, { params }: Params) {
    const { id } = await params;

    const existing = await db.machine.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json(
            { error: "Mesin tidak ditemukan." },
            { status: 404 },
        );
    }

    await db.machine.delete({ where: { id } });
    return NextResponse.json({ success: true });
}