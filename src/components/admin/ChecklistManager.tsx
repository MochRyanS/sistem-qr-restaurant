"use client";

import { SetStateAction, useCallback, useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    ListChecks,
    Check,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import {
    fetchChecklistItems,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
} from "@/lib/api-client";
import type { ChecklistItem } from "@/lib/types";

interface ChecklistManagerProps {
    /** Notifikasi parent saat item berubah (agar tahu perlu refresh data) */
    onChanged?: () => void;
}

export function ChecklistManager({ onChanged }: ChecklistManagerProps) {
    const { toast } = useToast();
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Form tambah
    const [newLabel, setNewLabel] = useState("");
    const [adding, setAdding] = useState(false);

    // Edit inline
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");

    // Hapus
    const [confirmDelete, setConfirmDelete] = useState<ChecklistItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchChecklistItems();
            setItems(data);
        } catch (err) {
            toast({
                title: "Gagal memuat checklist",
                description:
                    err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const init = async () => {
            await load();
        };

        void init();
    }, [load]);

    const notifyChanged = () => {
        onChanged?.();
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabel.trim()) return;
        setAdding(true);
        try {
            const created = await createChecklistItem({ label: newLabel.trim() });
            setItems((prev) => [...prev, created]);
            setNewLabel("");
            toast({
                title: "Item ditambahkan",
                description: `"${created.label}" ditambahkan ke checklist inspeksi.`,
            });
            notifyChanged();
        } catch (err) {
            toast({
                title: "Gagal menambah item",
                description:
                    err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
                variant: "destructive",
            });
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (item: ChecklistItem) => {
        setEditingId(item.id);
        setEditLabel(item.label);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditLabel("");
    };

    const saveEdit = async (item: ChecklistItem) => {
        if (!editLabel.trim()) return;
        try {
            const updated = await updateChecklistItem(item.id, {
                label: editLabel.trim(),
            });
            setItems((prev) =>
                prev.map((it) => (it.id === updated.id ? updated : it)),
            );
            setEditingId(null);
            setEditLabel("");
            toast({ title: "Item diperbarui", description: updated.label });
            notifyChanged();
        } catch (err) {
            toast({
                title: "Gagal memperbarui item",
                description:
                    err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await deleteChecklistItem(confirmDelete.id);
            setItems((prev) => prev.filter((it) => it.id !== confirmDelete.id));
            toast({
                title: "Item dihapus",
                description: `"${confirmDelete.label}" dihapus dari checklist.`,
            });
            notifyChanged();
        } catch (err) {
            toast({
                title: "Gagal menghapus item",
                description:
                    err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
            setConfirmDelete(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header & form tambah */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-amber-500" />
                    <div>
                        <h3 className="text-sm font-semibold">Item Checklist Inspeksi</h3>
                        <p className="text-xs text-muted-foreground">
                            Daftar komponen yang diperiksa saat inspeksi. Item ini dipakai di
                            semua form inspeksi mesin.
                        </p>
                    </div>
                </div>
                <Badge variant="secondary">{items.length} item</Badge>
            </div>

            {/* Form tambah item */}
            <form onSubmit={handleAdd} className="flex gap-2">
                <Input
                    placeholder="Nama item baru (cth: GAS RANGE & BURNER W/OVEN)"
                    value={newLabel}
                    onChange={(e: { target: { value: SetStateAction<string>; }; }) => setNewLabel(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" disabled={adding || !newLabel.trim()}>
                    {adding ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="mr-1 h-4 w-4" />
                    )}
                    Tambah
                </Button>
            </form>

            {/* Daftar item */}
            {loading ? (
                <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                    <ListChecks className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground">
                        Belum ada item checklist
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Tambahkan item komponen untuk form inspeksi.
                    </p>
                </div>
            ) : (
                <div className="max-h-96 space-y-1.5 overflow-y-auto rounded-lg border bg-card p-2 pr-2">
                    {items.map((item, idx) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-2 rounded-md border border-transparent px-2 py-2 hover:border-border hover:bg-muted/40"
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                {idx + 1}
                            </span>

                            {editingId === item.id ? (
                                <Input
                                    value={editLabel}
                                    onChange={(e: { target: { value: SetStateAction<string>; }; }) => setEditLabel(e.target.value)}
                                    className="h-8 flex-1"
                                    autoFocus
                                    onKeyDown={async (e: { key: string; preventDefault: () => void; }) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            await saveEdit(item);
                                        } else if (e.key === "Escape") {
                                            cancelEdit();
                                        }
                                    }}
                                />
                            ) : (
                                <span className="flex-1 text-sm font-medium">{item.label}</span>
                            )}

                            <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                                {item.key}
                            </span>

                            {editingId === item.id ? (
                                <div className="flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => saveEdit(item)}
                                        title="Simpan"
                                    >
                                        <Check className="h-4 w-4 text-emerald-600" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={cancelEdit}
                                        title="Batal"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => startEdit(item)}
                                        title="Edit nama item"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                        onClick={() => setConfirmDelete(item)}
                                        title="Hapus item"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Catatan: menghapus item tidak menghapus riwayat inspeksi lama — laporan
                masa lalu tetap menampilkan item sesuai snapshot saat dilaporkan.
            </p>

            {/* Konfirmasi hapus */}
            <AlertDialog
                open={Boolean(confirmDelete)}
                onOpenChange={(o: any) => !o && setConfirmDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus item checklist ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Item{" "}
                            <strong className="text-foreground">
                                {confirmDelete?.label}
                            </strong>{" "}
                            akan dihapus dari form inspeksi. Riwayat inspeksi yang sudah ada
                            tetap dipertahankan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}