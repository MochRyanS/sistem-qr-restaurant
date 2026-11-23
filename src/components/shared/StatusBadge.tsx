import { cn } from "@/lib/utils";
import type { MachineStatus } from "@/lib/types";

interface StatusBadgeProps {
    status: MachineStatus;
    className?: string;
}

const STATUS_STYLES: Record<MachineStatus, string> = {
    Normal:
        "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-400/30",
    Perbaikan:
        "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-400/30",
    Rusak:
        "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-400/30",
};

const STATUS_DOT: Record<MachineStatus, string> = {
    Normal: "bg-emerald-500",
    Perbaikan: "bg-amber-500",
    Rusak: "bg-red-500",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                STATUS_STYLES[status],
                className,
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
            {status}
        </span>
    );
}