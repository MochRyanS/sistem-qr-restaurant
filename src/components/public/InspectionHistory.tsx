"use client";

import { Loader2, ClipboardList, User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InspectionLog, ChecklistResult } from "@/lib/types";
import { formatDateTimeID } from "@/lib/serialize";
import { cn } from "@/lib/utils";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

interface InspectionHistoryProps {
    inspections: InspectionLog[];
    loading: boolean;
}

const RESULT_BADGE: Record<ChecklistResult, string> = {
    Standar:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    "Tidak Standar":
        "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

export function InspectionHistory({ inspections, loading }: InspectionHistoryProps) {
    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-amber-500" />
                <h2 className="text-base font-semibold">Riwayat Inspeksi</h2>
                {inspections.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                        {inspections.length} laporan
                    </Badge>
                )}
            </div>

            {loading ? (
                <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : inspections.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                    <ClipboardList className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground">
                        Belum ada riwayat inspeksi
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Laporan inspeksi yang dikirim akan muncul di sini.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {inspections.map((log) => {
                        // Gunakan snapshot item dari log (akurat meski item diubah/hapus)
                        const snapshot = log.checklistSnapshot;
                        const results = Object.entries(log.checklistResults);
                        const hasNonStandard = results.some(
                            ([, v]) => v === "Tidak Standar",
                        );
                        const summary = hasNonStandard
                            ? "Ada komponen Tidak Standar"
                            : "Semua Standar";

                        return (
                            <div
                                key={log.id}
                                className="rounded-lg border bg-card p-3 shadow-sm sm:p-4"
                            >
                                {/* Header laporan */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-2">
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold">
                                        <User className="h-3.5 w-3.5 text-amber-500" />
                                        {log.technicianName}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {formatDateTimeID(log.date)}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "ml-auto border-0 text-[10px]",
                                            hasNonStandard
                                                ? RESULT_BADGE["Tidak Standar"]
                                                : RESULT_BADGE.Standar,
                                        )}
                                    >
                                        {summary}
                                    </Badge>
                                </div>

                                {/* Hasil checklist per item (dari snapshot) */}
                                <div className="mt-2 space-y-1">
                                    {snapshot.map((snapItem, idx) => {
                                        const itemKey =
                                            typeof snapItem.key === "string" || typeof snapItem.key === "number"
                                                ? snapItem.key
                                                : String(idx);
                                        const result = log.checklistResults?.[itemKey];
                                        return (
                                            <div
                                                key={snapItem.key}
                                                className="flex items-center justify-between gap-2 rounded px-2 py-1 text-xs"
                                            >
                                                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-muted text-[9px] font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="truncate">{snapItem.label}</span>
                                                </span>
                                                {result ? (
                                                    <span
                                                        className={cn(
                                                            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                                            RESULT_BADGE[result],
                                                        )}
                                                    >
                                                        {result}
                                                    </span>
                                                ) : (
                                                    <span className="shrink-0 text-muted-foreground/50">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Catatan */}
                                {log.notes && (
                                    <div className="mt-2 rounded bg-muted/50 p-2 text-xs italic text-muted-foreground">
                                        &ldquo;{log.notes}&rdquo;
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}