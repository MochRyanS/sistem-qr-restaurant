"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ArrowLeft, MapPin, Loader2, ImageOff, AlertCircle,
    ShieldCheck, ShieldX, FileText, ClipboardCheck, User, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { fetchMachine } from "@/lib/api-client";
import { formatDateID } from "@/lib/serialize";
import type { Machine } from "@/lib/types";

interface PublicMachineViewProps {
    machineId: string;
    onBack: () => void;
}

export function PublicMachineView({ machineId, onBack }: PublicMachineViewProps) {
    const [machine, setMachine] = useState<Machine | null>(null);
    const [loadingMachine, setLoadingMachine] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMachine = useCallback(async () => {
        setLoadingMachine(true);
        setError(null);
        try {
            const data = await fetchMachine(machineId);
            setMachine(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Mesin tidak dapat dimuat.");
        } finally {
            setLoadingMachine(false);
        }
    }, [machineId]);

    useEffect(() => { void loadMachine(); }, [loadMachine]);

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

    if (error || !machine) {
        return (
            <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
                <PublicHeader onBack={onBack} />
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400" />
                    <div>
                        <p className="text-base font-semibold">Mesin tidak ditemukan</p>
                        <p className="mt-1 text-sm text-muted-foreground">{error ?? "QR Code mungkin tidak valid atau mesin sudah dihapus."}</p>
                    </div>
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />Kembali ke Dashboard
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
                    <div className="relative aspect-video w-full bg-muted">
                        {machine.imageUrl ? (
                            <img src={machine.imageUrl} alt={machine.name} className="h-full w-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                                <ImageOff className="h-8 w-8" />
                                <span className="text-xs">Foto tidak tersedia</span>
                            </div>
                        )}
                        <div className="absolute right-2 top-2">
                            <StatusBadge status={machine.status} className="shadow-sm" />
                        </div>
                    </div>
                    <CardContent className="space-y-3 p-4">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Kode Aset</p>
                            <p className="font-mono text-sm font-bold text-amber-600">{machine.code}</p>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-50">{machine.name}</h1>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 text-amber-500" />{machine.location}
                        </div>
                    </CardContent>
                </Card>

                {/* Deskripsi mesin */}
                {machine.description && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-amber-500" />
                                <h2 className="text-sm font-semibold">Deskripsi Mesin</h2>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">{machine.description}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Preventive Maintenance */}
                <Card>
                    <CardContent className="p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-amber-500" />
                            <h2 className="text-sm font-semibold">Preventive Maintenance</h2>
                        </div>
                        <div className={`flex items-center gap-3 rounded-lg p-3 ${machine.preventiveDone ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-amber-50 dark:bg-amber-950/30"
                            }`}>
                            {machine.preventiveDone ? (
                                <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-500" />
                            ) : (
                                <ShieldX className="h-8 w-8 shrink-0 text-amber-500" />
                            )}
                            <div>
                                <p className="text-sm font-bold">{machine.preventiveDone ? "Sudah Preventive" : "Belum Preventive"}</p>
                                <p className="text-xs text-muted-foreground">
                                    {machine.preventiveDone ? "Maintenance preventive telah dilakukan" : "Maintenance preventive belum dilakukan"}
                                </p>
                            </div>
                        </div>

                        {/* Detail preventive */}
                        {machine.preventiveDone && (
                            <div className="mt-3 space-y-2 rounded-lg border p-3">
                                {machine.preventiveTechnician && (
                                    <div className="flex items-start gap-2">
                                        <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <div>
                                            <p className="text-[10px] font-medium uppercase text-muted-foreground">Teknisi</p>
                                            <p className="text-sm font-medium">{machine.preventiveTechnician}</p>
                                        </div>
                                    </div>
                                )}
                                {machine.preventiveDate && (
                                    <div className="flex items-start gap-2">
                                        <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <div>
                                            <p className="text-[10px] font-medium uppercase text-muted-foreground">Tanggal</p>
                                            <p className="text-sm font-medium">{formatDateID(machine.preventiveDate)}</p>
                                        </div>
                                    </div>
                                )}
                                {machine.preventiveNotes && (
                                    <div className="flex items-start gap-2">
                                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-medium uppercase text-muted-foreground">Catatan</p>
                                            <p className="text-sm leading-relaxed">{machine.preventiveNotes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
            <PublicFooter />
        </div>
    );
}

function PublicHeader({ onBack }: { onBack: () => void }) {
    return (
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
                <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 px-2" aria-label="Kembali">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-amber-400">
                        <ClipboardCheck className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-tight">Info Mesin</p>
                        <p className="text-[10px] text-muted-foreground">Detail Aset</p>
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