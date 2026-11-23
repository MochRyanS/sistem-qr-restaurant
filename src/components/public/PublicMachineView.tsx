"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ArrowLeft,
    MapPin,
    Loader2,
    ImageOff,
    Factory,
    ClipboardCheck,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MachineSpecs } from "@/components/public/MachineSpecs";
import { InspectionForm } from "@/components/public/InspectionForm";
import { InspectionHistory } from "@/components/public/InspectionHistory";
import { fetchMachine, fetchInspections, fetchChecklistItems } from "@/lib/api-client";
import type { Machine, InspectionLog, ChecklistItem } from "@/lib/types";

interface PublicMachineViewProps {
    machineId: string;
    onBack: () => void;
}

export function PublicMachineView({ machineId, onBack }: PublicMachineViewProps) {
    const [machine, setMachine] = useState<Machine | null>(null);
    const [inspections, setInspections] = useState<InspectionLog[]>([]);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [loadingMachine, setLoadingMachine] = useState(true);
    const [loadingInspections, setLoadingInspections] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMachine = useCallback(async () => {
        setLoadingMachine(true);
        setError(null);
        try {
            const data = await fetchMachine(machineId);
            setMachine(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Mesin tidak dapat dimuat.",
            );
        } finally {
            setLoadingMachine(false);
        }
    }, [machineId]);

    const loadInspections = useCallback(async () => {
        setLoadingInspections(true);
        try {
            const data = await fetchInspections(machineId);
            setInspections(data);
        } catch {
            // Riwayat gagal dimuat tidak fatal
        } finally {
            setLoadingInspections(false);
        }
    }, [machineId]);

    const loadChecklistItems = useCallback(async () => {
        try {
            const data = await fetchChecklistItems();
            setChecklistItems(data);
        } catch {
            // Checklist gagal dimuat — form akan tampilkan pesan kosong
        }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            await Promise.all([
                loadMachine(),
                loadInspections(),
                loadChecklistItems(),
            ]);
        };

        void loadAll();
    }, [loadMachine, loadInspections, loadChecklistItems]);

    const handleInspectionSubmitted = async () => {
        // Muat ulang data mesin (status mungkin berubah) & riwayat
        await loadMachine();
        void loadInspections();
    };

    // Loading awal
    if (loadingMachine) {
        return (
            <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
                <PublicHeader onBack={onBack} />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
            </div>
        );
    }

    // Error / mesin tidak ditemukan
    if (error || !machine) {
        return (
            <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
                <PublicHeader onBack={onBack} />
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400" />
                    <div>
                        <p className="text-base font-semibold">Mesin tidak ditemukan</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {error ?? "QR Code mungkin tidak valid atau mesin sudah dihapus."}
                        </p>
                    </div>
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Dashboard
                    </Button>
                </div>
                <PublicFooter />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
            <PublicHeader onBack={onBack} />

            <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 py-4">
                {/* Kartu identitas mesin */}
                <Card className="overflow-hidden">
                    {/* Foto mesin */}
                    <div className="relative aspect-video w-full bg-muted">
                        {machine.imageUrl ? (
                            <img
                                src={machine.imageUrl}
                                alt={machine.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                                <ImageOff className="h-8 w-8" />
                                <span className="text-xs">Foto tidak tersedia</span>
                            </div>
                        )}
                        {/* Overlay status */}
                        <div className="absolute right-2 top-2">
                            <StatusBadge status={machine.status} className="shadow-sm" />
                        </div>
                    </div>

                    <CardContent className="space-y-3 p-4">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                Kode Aset
                            </p>
                            <p className="font-mono text-sm font-bold text-amber-600">
                                {machine.code}
                            </p>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-50">
                                {machine.name}
                            </h1>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 text-amber-500" />
                            {machine.location}
                        </div>
                    </CardContent>
                </Card>

                {/* Spesifikasi teknis */}
                <section className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-amber-500" />
                        <h2 className="text-base font-semibold">Spesifikasi Teknis</h2>
                    </div>
                    <MachineSpecs specs={machine.specs} />
                </section>

                {/* Form inspeksi */}
                <section className="space-y-2">
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-amber-500" />
                        <h2 className="text-base font-semibold">Inspeksi Mingguan</h2>
                    </div>
                    <InspectionForm
                        machineId={machine.id}
                        items={checklistItems}
                        onSubmitted={handleInspectionSubmitted}
                    />
                </section>

                {/* Riwayat inspeksi */}
                <InspectionHistory
                    inspections={inspections}
                    loading={loadingInspections}
                />
            </main>

            <PublicFooter />
        </div>
    );
}

function PublicHeader({ onBack }: { onBack: () => void }) {
    return (
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="-ml-2 px-2"
                    aria-label="Kembali"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-amber-400">
                        <ClipboardCheck className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-tight">
                            Inspeksi Mesin
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            Form Pengecekan Mingguan
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}

function PublicFooter() {
    return (
        <footer className="mt-auto border-t border-zinc-200 bg-white py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto max-w-md px-4 text-center text-[10px] text-muted-foreground">
                Sistem Manajemen Aset &amp; Inspeksi Mesin &middot; Dynamic QR Code
            </div>
        </footer>
    );
}