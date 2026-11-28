"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchPreventiveLogs, addPreventiveLog } from "@/lib/api-client";
import { formatDateID } from "@/lib/serialize";
import type { Machine, PreventiveLog } from "@/lib/types";

interface PreventiveLogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    machine: Machine | null;
    onUpdated?: () => void;
}

function todayISO(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().split("T")[0];
}

export function PreventiveLogDialog({ open, onOpenChange, machine, onUpdated }: PreventiveLogDialogProps) {
    const { toast } = useToast();
    const [logs, setLogs] = useState<PreventiveLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [technicianName, setTechnicianName] = useState("");
    const [date, setDate] = useState(todayISO());
    const [notes, setNotes] = useState("");

    const load = useCallback(async () => {
        if (!machine) return;
        setLoading(true);
        try {
            const data = await fetchPreventiveLogs(machine.id);
            setLogs(data);
        } catch { } finally { setLoading(false); }
    }, [machine]);

    useEffect(() => {
        if (open && machine) {
            void load();
            setTechnicianName(""); setDate(todayISO()); setNotes("");
        }
    }, [open, machine, load]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!machine) return;
        if (!technicianName.trim()) { toast({ title: "Validasi gagal", description: "Nama teknisi wajib.", variant: "destructive" }); return; }
        if (!date) { toast({ title: "Validasi gagal", description: "Tanggal wajib.", variant: "destructive" }); return; }
        setSubmitting(true);
        try {
            const newLog = await addPreventiveLog(machine.id, { technicianName: technicianName.trim(), date, notes: notes.trim() });
            setLogs((prev) => [newLog, ...prev]);
            setTechnicianName(""); setDate(todayISO()); setNotes("");
            toast({ title: "Preventive ditambahkan", description: "Data terbaru akan tampil di QR scan." });
            onUpdated?.();
        } catch (err) {
            toast({ title: "Gagal", description: err instanceof Error ? err.message : "Error.", variant: "destructive" });
        } finally { setSubmitting(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Log Preventive — {machine?.name}</DialogTitle>
                    <DialogDescription>Riwayat preventive. Entry terbaru tampil di QR scan.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="prev-tech">Nama Teknisi</Label>
                            <Input id="prev-tech" placeholder="cth: Didi Sunardi" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="prev-date">Tanggal Pengecekan</Label>
                            <Input id="prev-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="prev-notes">Catatan</Label>
                        <Textarea id="prev-notes" placeholder="Catatan hasil pengecekan..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                    </div>
                    <Button type="submit" disabled={submitting} size="sm" className="w-full">
                        {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                        Tambah Log Preventive
                    </Button>
                </form>

                <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Riwayat Preventive ({logs.length})</h3>
                    {loading ? (
                        <div className="flex h-20 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : logs.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Belum ada riwayat preventive.</div>
                    ) : (
                        <div className="max-h-64 overflow-y-auto rounded-lg border">
                            <Table>
                                <TableHeader><TableRow className="bg-muted/50"><TableHead>Teknisi</TableHead><TableHead>Tanggal</TableHead><TableHead>Catatan</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {logs.map((log, idx) => (
                                        <TableRow key={log.id} className={idx === 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}>
                                            <TableCell className="text-xs font-medium">{idx === 0 && <span className="mr-1 text-[9px] text-emerald-600">TERBARU</span>}{log.technicianName}</TableCell>
                                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateID(log.date)}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{log.notes || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}