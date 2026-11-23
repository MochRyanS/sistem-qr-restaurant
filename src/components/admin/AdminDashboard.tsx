"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Plus,
    Loader2,
    Wrench,
    CheckCircle2,
    AlertTriangle,
    Factory,
    QrCode as QrIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MachineList } from "@/components/admin/MachineList";
import { MachineFormModal } from "@/components/admin/MachineFormModal";
import { QRPrintDialog } from "@/components/admin/QRPrintDialog";
import { ChecklistManager } from "@/components/admin/ChecklistManager";
import { useToast } from "@/hooks/use-toast";
import {
    fetchMachines,
    deleteMachine,
} from "@/lib/api-client";
import type { Machine } from "@/lib/types";

export function AdminDashboard() {
    const { toast } = useToast();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);

    // State modal
    const [formOpen, setFormOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
    const [qrMachine, setQrMachine] = useState<Machine | null>(null);
    const [qrOpen, setQrOpen] = useState(false);

    const loadMachines = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchMachines();
            setMachines(data);
        } catch (err) {
            toast({
                title: "Gagal memuat data",
                description:
                    err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const fetchMachines = async () => {
            await loadMachines();
        };

        void fetchMachines();
    }, [loadMachines]);

    const handleAdd = () => {
        setEditingMachine(null);
        setFormOpen(true);
    };

    const handleEdit = (machine: Machine) => {
        setEditingMachine(machine);
        setFormOpen(true);
    };

    const handleGenerateQR = (machine: Machine) => {
        setQrMachine(machine);
        setQrOpen(true);
    };

    const handleSaved = (machine: Machine) => {
        setMachines((prev) => {
            const idx = prev.findIndex((m) => m.id === machine.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = machine;
                return next;
            }
            return [machine, ...prev];
        });
    };

    const handleDelete = async (machine: Machine) => {
        try {
            await deleteMachine(machine.id);
            setMachines((prev) => prev.filter((m) => m.id !== machine.id));
            toast({
                title: "Mesin dihapus",
                description: `${machine.name} (${machine.code}) telah dihapus dari sistem.`,
            });
        } catch (err) {
            toast({
                title: "Gagal menghapus",
                description:
                    err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
                variant: "destructive",
            });
        }
    };

    // Statistik ringkas
    const stats = {
        total: machines.length,
        normal: machines.filter((m) => m.status === "Normal").length,
        perbaikan: machines.filter((m) => m.status === "Perbaikan").length,
        rusak: machines.filter((m) => m.status === "Rusak").length,
    };

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-amber-400">
                            <Factory className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">
                                Manajemen Aset Mesin
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Sistem Inspeksi Berbasis Dynamic QR Code
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleAdd} size="sm" className="shrink-0">
                        <Plus className="mr-1 h-4 w-4" />
                        <span className="hidden sm:inline">Tambah Mesin Baru</span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
                {/* Statistik */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard
                        label="Total Mesin"
                        value={stats.total}
                        icon={<Factory className="h-4 w-4" />}
                        tone="zinc"
                    />
                    <StatCard
                        label="Normal"
                        value={stats.normal}
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        tone="emerald"
                    />
                    <StatCard
                        label="Perbaikan"
                        value={stats.perbaikan}
                        icon={<Wrench className="h-4 w-4" />}
                        tone="amber"
                    />
                    <StatCard
                        label="Rusak"
                        value={stats.rusak}
                        icon={<AlertTriangle className="h-4 w-4" />}
                        tone="red"
                    />
                </div>

                {/* Info Dynamic QR */}
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <QrIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                        <strong>Cara kerja Dynamic QR:</strong> Setiap mesin memiliki QR
                        Code yang men-encode tautan ke halaman detailnya. Saat data mesin
                        di-edit di dashboard ini, informasi yang muncul saat QR di-scan
                        akan otomatis diperbarui — tanpa perlu mencetak ulang QR.
                    </p>
                </div>

                {/* Manajemen item checklist */}
                <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-900 sm:p-5">
                    <ChecklistManager />
                </div>

                {/* Daftar mesin */}
                <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-900 sm:p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 sm:text-base">
                            Daftar Mesin Terdaftar
                        </h2>
                    </div>
                    <MachineList
                        machines={machines}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onGenerateQR={handleGenerateQR}
                    />
                </div>
            </main>

            {/* Footer sticky */}
            <footer className="mt-auto border-t border-zinc-200 bg-white py-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
                    Sistem Manajemen Aset &amp; Inspeksi Mesin — Dynamic QR Code &middot;
                    Data tersimpan di database lokal SQLite
                </div>
            </footer>

            {/* Modals */}
            <MachineFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                editingMachine={editingMachine}
                onSaved={handleSaved}
            />
            <QRPrintDialog
                open={qrOpen}
                onOpenChange={setQrOpen}
                machine={qrMachine}
            />

            {/* Loading overlay saat initial load */}
            {loading && machines.length === 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-zinc-950/60">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    tone: "zinc" | "emerald" | "amber" | "red";
}

function StatCard({ label, value, icon, tone }: StatCardProps) {
    const toneStyles: Record<StatCardProps["tone"], string> = {
        zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        emerald:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
        amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
        red: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    };
    return (
        <Card className="overflow-hidden">
            <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneStyles[tone]}`}
                >
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-lg font-bold leading-none text-zinc-900 dark:text-zinc-50 sm:text-xl">
                        {value}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs">
                        {label}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}