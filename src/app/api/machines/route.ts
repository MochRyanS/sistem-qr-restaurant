import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeMachine } from "@/lib/serialize";
import type { MachineInput, MachineStatus } from "@/lib/types";

const VALID_STATUS: Set<MachineStatus> = new Set(["Normal", "Perbaikan", "Rusak"]);

/** GET /api/machines — daftar semua mesin */
export async function GET() {
    const rows = await db.machine.findMany({
        orderBy: { createdAt: "desc" },
    });
    const machines = rows.map(serializeMachine);
    return NextResponse.json({ machines });
}

/** POST /api/machines — tambah mesin baru */
export async function POST(req: NextRequest) {
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

    // Validasi field wajib
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

    // Cek duplikasi kode aset
    const existing = await db.machine.findUnique({ where: { code: code.trim() } });
    if (existing) {
        return NextResponse.json(
            { error: `Kode aset "${code.trim()}" sudah digunakan mesin lain.` },
            { status: 409 },
        );
    }

    // Validasi & sanitasi specs
    const cleanSpecs = Array.isArray(specs)
        ? specs
            .filter((s) => s && s.key && s.key.trim())
            .map((s) => ({ key: s.key.trim(), value: (s.value ?? "").trim() }))
        : [];

    const finalStatus = VALID_STATUS.has(status) ? status : "Normal";

    const row = await db.machine.create({
        data: {
            code: code.trim(),
            name: name.trim(),
            location: location.trim(),
            specs: JSON.stringify(cleanSpecs),
            imageUrl: (imageUrl ?? "").trim(),
            status: finalStatus,
        },
    });

    return NextResponse.json({ machine: serializeMachine(row) }, { status: 201 });
}