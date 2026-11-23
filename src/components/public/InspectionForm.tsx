"use client";

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, SetStateAction, useState } from "react";
import { Loader2, Send, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { submitInspection } from "@/lib/api-client";
import {
    CHECKLIST_RESULT_OPTIONS,
    type ChecklistItem,
    type ChecklistResult,
    type ChecklistResults,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface InspectionFormProps {
    machineId: string;
    items: ChecklistItem[];
    onSubmitted: () => void;
}

const RESULT_TONE: Record<ChecklistResult, string> = {
    Standar:
        "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    "Tidak Standar":
        "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export function InspectionForm({ machineId, items, onSubmitted }: InspectionFormProps) {
    const { toast } = useToast();
    const [technicianName, setTechnicianName] = useState("");
    const [notes, setNotes] = useState("");
    const [results, setResults] = useState<ChecklistResults>({});
    const [submitting, setSubmitting] = useState(false);

    const handleResultChange = (itemKey: string, value: ChecklistResult) => {
        setResults((prev: any) => ({ ...prev, [itemKey]: value }));
    };

    const answeredCount = Object.keys(results).length;
    const totalItems = items.length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!technicianName.trim()) {
            toast({
                title: "Validasi gagal",
                description: "Nama teknisi wajib diisi.",
                variant: "destructive",
            });
            return;
        }

        if (totalItems === 0) {
            toast({
                title: "Checklist kosong",
                description: "Belum ada item checklist. Hubungi admin untuk menambahkan item.",
                variant: "destructive",
            });
            return;
        }

        if (answeredCount < totalItems) {
            toast({
                title: "Checklist belum lengkap",
                description: `Mohon periksa seluruh ${totalItems} item (${answeredCount}/${totalItems} terisi).`,
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const { machineStatus } = await submitInspection(machineId, {
                technicianName: technicianName.trim(),
                checklistResults: results,
                notes: notes.trim(),
            });

            toast({
                title: "Laporan terkirim",
                description:
                    machineStatus === "Normal"
                        ? "Inspeksi tercatat. Semua komponen Standar."
                        : `Inspeksi tercatat. Status mesin diperbarui menjadi: ${machineStatus}.`,
            });

            // Reset form
            setTechnicianName("");
            setNotes("");
            setResults({});
            onSubmitted();
        } catch (err) {
            toast({
                title: "Gagal mengirim laporan",
                description:
                    err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
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
                    Form Checklist Inspeksi Mingguan
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Periksa setiap komponen: tandai <strong>Standar</strong> atau{" "}
                    <strong>Tidak Standar</strong>.
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nama teknisi */}
                    <div className="space-y-1.5">
                        <Label htmlFor="tech-name">Nama Teknisi Pemeriksa</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="tech-name"
                                placeholder="cth: DIDI SUNARDI"
                                value={technicianName}
                                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setTechnicianName(e.target.value)}
                                className="pl-9"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Item Komponen yang Diperiksa</Label>
                            <span className="text-[11px] text-muted-foreground">
                                {answeredCount}/{totalItems} terisi
                            </span>
                        </div>

                        {totalItems === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                                Belum ada item checklist terdaftar.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "rounded-lg border bg-card p-2.5 transition-colors sm:p-3",
                                            results[item.key]
                                                ? "border-amber-300 dark:border-amber-800"
                                                : "border-border",
                                        )}
                                    >
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm font-medium leading-tight">
                                                {item.label}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {CHECKLIST_RESULT_OPTIONS.map((opt: { value: Key | null | undefined; label: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => {
                                                const selected = results[item.key] === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => {
                                                            if (opt.value != null) {
                                                                handleResultChange(item.key, opt.value as ChecklistResult);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "rounded-md border px-3 py-2 text-xs font-semibold transition-all sm:text-sm",
                                                            selected && opt.value != null
                                                                ? RESULT_TONE[opt.value as ChecklistResult]
                                                                : "border-border bg-background text-muted-foreground hover:border-amber-300 hover:bg-muted/50",
                                                        )}
                                                        aria-pressed={selected}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Catatan */}
                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Catatan / Temuan Lapangan</Label>
                        <Textarea
                            id="notes"
                            placeholder="Tuliskan temuan, kondisi khusus, atau rekomendasi..."
                            value={notes}
                            onChange={(e: { target: { value: SetStateAction<string>; }; }) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={submitting || totalItems === 0}
                        size="lg"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mengirim...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Kirim Laporan Pengecekan
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}