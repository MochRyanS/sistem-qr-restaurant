"use client";

import {
    Edit2,
    QrCode,
    Trash2,
    Loader2,
    Search,
    MapPin,
    ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SetStateAction, useState } from "react";
import type { Machine } from "@/lib/types";
import { formatDateID } from "@/lib/serialize";

interface MachineListProps {
    machines: Machine[];
    loading: boolean;
    onEdit: (machine: Machine) => void;
    onDelete: (machine: Machine) => void;
    onGenerateQR: (machine: Machine) => void;
}

export function MachineList({
    machines,
    loading,
    onEdit,
    onDelete,
    onGenerateQR,
}: MachineListProps) {
    const [search, setSearch] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<Machine | null>(null);

    const filtered = machines.filter((m) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            m.name.toLowerCase().includes(q) ||
            m.code.toLowerCase().includes(q) ||
            m.location.toLowerCase().includes(q)
        );
    });

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search bar */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Cari nama, kode, atau lokasi mesin..."
                    value={search}
                    onChange={(e: { target: { value: SetStateAction<string>; }; }) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                        {machines.length === 0
                            ? "Belum ada mesin terdaftar."
                            : "Tidak ada mesin yang cocok dengan pencarian."}
                    </p>
                    {machines.length === 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Klik &quot;Tambah Mesin Baru&quot; untuk memulai.
                        </p>
                    )}
                </div>
            ) : (
                <>
                    {/* Desktop: tabel */}
                    <div className="hidden overflow-hidden rounded-lg border md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-15">Foto</TableHead>
                                    <TableHead>Nama Mesin</TableHead>
                                    <TableHead>Kode Aset</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="whitespace-nowrap">Diperbarui</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((m) => (
                                    <TableRow key={m.id} className="group">
                                        <TableCell>
                                            <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
                                                {m.imageUrl ? (
                                                    <img
                                                        src={m.imageUrl}
                                                        alt={m.name}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                        <ImageOff className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{m.name}</TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs font-semibold text-amber-600">
                                                {m.code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {m.location}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={m.status} />
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                            {formatDateID(m.updatedAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onGenerateQR(m)}
                                                    title="Generate & Cetak QR"
                                                >
                                                    <QrCode className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEdit(m)}
                                                    title="Edit mesin"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setConfirmDelete(m)}
                                                    title="Hapus mesin"
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile: card grid */}
                    <div className="grid gap-3 sm:grid-cols-2 md:hidden">
                        {filtered.map((m) => (
                            <div
                                key={m.id}
                                className="rounded-lg border bg-card p-4 shadow-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                                        {m.imageUrl ? (
                                            <img
                                                src={m.imageUrl}
                                                alt={m.name}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                <ImageOff className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-sm font-semibold">{m.name}</h3>
                                        <p className="font-mono text-xs font-semibold text-amber-600">
                                            {m.code}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            <MapPin className="mr-1 inline h-3 w-3" />
                                            {m.location}
                                        </p>
                                        <div className="mt-2">
                                            <StatusBadge status={m.status} />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2 border-t pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => onGenerateQR(m)}
                                    >
                                        <QrCode className="mr-1 h-4 w-4" /> QR
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => onEdit(m)}
                                    >
                                        <Edit2 className="mr-1 h-4 w-4" /> Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setConfirmDelete(m)}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Info jumlah */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            Menampilkan {filtered.length} dari {machines.length} mesin
                        </span>
                        <Badge variant="secondary">{machines.length} total</Badge>
                    </div>
                </>
            )}

            {/* Dialog konfirmasi hapus */}
            <AlertDialog
                open={Boolean(confirmDelete)}
                onOpenChange={(o: any) => !o && setConfirmDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus mesin ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan menghapus{" "}
                            <strong className="text-foreground">{confirmDelete?.name}</strong>{" "}
                            ({confirmDelete?.code}). Seluruh riwayat inspeksi terkait juga
                            akan dihapus. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (confirmDelete) onDelete(confirmDelete);
                                setConfirmDelete(null);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}