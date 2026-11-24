"use client";

import { Loader2, ClipboardList, User, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InspectionLog } from "@/lib/types";
import { formatDateID } from "@/lib/serialize";

interface InspectionHistoryProps {
    inspections: InspectionLog[];
    loading: boolean;
}

export function InspectionHistory({ inspections, loading }: InspectionHistoryProps) {
    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-amber-500" />
                <h2 className="text-base font-semibold">Riwayat Inspeksi</h2>
                {inspections.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">{inspections.length} laporan</Badge>
                )}
            </div>
            {loading ? (
                <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : inspections.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                    <ClipboardList className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground">Belum ada riwayat inspeksi</p>
                    <p className="mt-1 text-xs text-muted-foreground">Laporan inspeksi yang dikirim akan muncul di sini.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {inspections.map((log) => (
                        <div key={log.id} className="rounded-lg border bg-card p-3 shadow-sm sm:p-4">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-2">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold">
                                    <User className="h-3.5 w-3.5 text-amber-500" />{log.technicianName}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />{formatDateID(log.date)}
                                </span>
                            </div>
                            {log.notes ? (
                                <div className="mt-2 flex items-start gap-2">
                                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <p className="text-xs leading-relaxed text-foreground">{log.notes}</p>
                                </div>
                            ) : (
                                <p className="mt-2 text-xs italic text-muted-foreground">Tidak ada catatan.</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}