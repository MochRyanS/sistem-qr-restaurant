"use client";

import { Cog } from "lucide-react";
import type { MachineSpec } from "@/lib/types";

interface MachineSpecsProps {
    specs: MachineSpec[];
}

export function MachineSpecs({ specs }: MachineSpecsProps) {
    if (!specs || specs.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Belum ada spesifikasi teknis tercatat untuk mesin ini.
            </div>
        );
    }

    return (
        <dl className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
            {specs.map((spec, idx) => (
                <div
                    key={`${spec.key}-${idx}`}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3"
                >
                    <dt className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                        <Cog className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span className="truncate">{spec.key}</span>
                    </dt>
                    <dd className="shrink-0 text-right text-xs font-semibold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                        {spec.value || "-"}
                    </dd>
                </div>
            ))}
        </dl>
    );
}