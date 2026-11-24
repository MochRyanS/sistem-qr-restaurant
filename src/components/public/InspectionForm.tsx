"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { submitInspection } from "@/lib/api-client";

interface InspectionFormProps {
    machineId: string;
    onSubmitted: () => void;
}

function todayISO(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().split("T")[0];
}

export function InspectionForm({ machineId, onSubmitted }: InspectionFormProps) {
    const { toast } = useToast();
    const [technicianName, setTechnicianName] = useState("");
    const [date, setDate] = useState(todayISO());
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!technicianName.trim()) {
            toast({ title: "Validasi gagal", description: "Nama teknisi wajib diisi.", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            await submitInspection(machineId, {
                technicianName: technicianName.trim(),
                notes: notes.trim(),
                date,
            });
            toast({ title: "Laporan terkirim", description: "Inspeksi berhasil tercatat." });
            setTechnicianName("");
            setNotes("");
            setDate(todayISO());
            onSubmitted();
        } catch (err) {
            toast({
                title: "Gagal mengirim laporan",
                description: err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="border-amber-200 dark:border-amber-900/40">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    Form Laporan Inspeksi
                </CardTitle>
                <p className="text-xs text-muted-foreground">Isi data inspeksi, lalu kirim laporan.</p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="tech-name">Nama Teknisi Pemeriksa</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input id="tech-name" placeholder="cth: Didi Sunardi" value={technicianName}
                                onChange={(e) => setTechnicianName(e.target.value)} className="pl-9" autoComplete="off" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="insp-date">Tanggal Inspeksi</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input id="insp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-9" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Catatan / Temuan Lapangan</Label>
                        <Textarea id="notes" placeholder="Tuliskan temuan, kondisi khusus, atau rekomendasi..."
                            value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting} size="lg">
                        {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</>)
                            : (<><Send className="mr-2 h-4 w-4" />Kirim Laporan</>)}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}