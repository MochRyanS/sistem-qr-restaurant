"use client";

import { SetStateAction, useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { createMachine, updateMachine } from "@/lib/api-client";
import type { Machine, MachineInput, MachineSpec, MachineStatus } from "@/lib/types";

interface MachineFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Mesin yang sedang diedit (null = mode tambah) */
    editingMachine?: Machine | null;
    onSaved: (machine: Machine) => void;
}

const STATUS_OPTIONS: { value: MachineStatus; label: string }[] = [
    { value: "Normal", label: "Normal" },
    { value: "Perbaikan", label: "Perbaikan" },
    { value: "Rusak", label: "Rusak" },
];

export function MachineFormModal({
    open,
    onOpenChange,
    editingMachine,
    onSaved,
}: MachineFormModalProps) {
    const { toast } = useToast();
    const isEdit = Boolean(editingMachine);

    const [submitting, setSubmitting] = useState(false);
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [status, setStatus] = useState<MachineStatus>("Normal");
    const [specs, setSpecs] = useState<MachineSpec[]>([{ key: "", value: "" }]);

    // Reset form setiap kali modal dibuka / mesin berubah
    useEffect(() => {
        if (!open) return;
        if (editingMachine) {
            setCode(editingMachine.code);
            setName(editingMachine.name);
            setLocation(editingMachine.location);
            setImageUrl(editingMachine.imageUrl);
            setStatus(editingMachine.status);
            setSpecs(
                editingMachine.specs.length > 0
                    ? editingMachine.specs
                    : [{ key: "", value: "" }],
            );
        } else {
            setCode("");
            setName("");
            setLocation("");
            setImageUrl("");
            setStatus("Normal");
            setSpecs([{ key: "", value: "" }]);
        }
    }, [open, editingMachine]);

    const addSpec = () =>
        setSpecs((prev) => [...prev, { key: "", value: "" }]);

    const removeSpec = (index: number) =>
        setSpecs((prev) => prev.filter((_, i) => i !== index));

    const updateSpec = (index: number, field: keyof MachineSpec, value: string) =>
        setSpecs((prev) =>
            prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
        );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi sederhana
        if (!code.trim() || !name.trim() || !location.trim()) {
            toast({
                title: "Validasi gagal",
                description: "Kode, Nama, dan Lokasi mesin wajib diisi.",
                variant: "destructive",
            });
            return;
        }

        const input: MachineInput = {
            code: code.trim(),
            name: name.trim(),
            location: location.trim(),
            imageUrl: imageUrl.trim(),
            status,
            specs: specs
                .filter((s) => s.key.trim())
                .map((s) => ({ key: s.key.trim(), value: s.value.trim() })),
        };

        setSubmitting(true);
        try {
            const saved = isEdit && editingMachine
                ? await updateMachine(editingMachine.id, input)
                : await createMachine(input);

            toast({
                title: isEdit ? "Mesin diperbarui" : "Mesin ditambahkan",
                description: isEdit
                    ? "Perubahan tersimpan. QR Code akan menampilkan info terbaru saat di-scan."
                    : `Mesin "${saved.name}" berhasil didaftarkan.`,
            });
            onSaved(saved);
            onOpenChange(false);
        } catch (err) {
            toast({
                title: "Gagal menyimpan",
                description:
                    err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Mesin" : "Tambah Mesin Baru"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Perbarui data mesin. Data baru akan otomatis tampil saat QR di-scan (Dynamic QR)."
                            : "Lengkapi data mesin untuk didaftarkan ke sistem."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Identitas mesin */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="code">
                                Kode / Nomor Aset <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="code"
                                placeholder="cth: MCH-PRD-001"
                                value={code}
                                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setCode(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Nama Mesin <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="cth: Mesin CNC Milling VMC-500"
                                value={name}
                                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="location">
                                Lokasi Penempatan <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="location"
                                placeholder="cth: Ruang Produksi A"
                                value={location}
                                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setLocation(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status Mesin</Label>
                            <Select
                                value={status}
                                onValueChange={(v: any) => setStatus(v as MachineStatus)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL Foto Mesin</Label>
                        <Input
                            id="imageUrl"
                            placeholder="https://..."
                            value={imageUrl}
                            onChange={(e: { target: { value: SetStateAction<string>; }; }) => setImageUrl(e.target.value)}
                        />
                        {imageUrl.trim() && (
                            <p className="text-xs text-muted-foreground">
                                Pratinjau foto akan tampil di kartu QR & halaman inspeksi.
                            </p>
                        )}
                    </div>

                    <Separator />

                    {/* Spesifikasi dinamis */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Spesifikasi Mesin</Label>
                                <p className="text-xs text-muted-foreground">
                                    Tambahkan atribut teknis (Daya, Kapasitas, Tahun, dll).
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addSpec}
                            >
                                <Plus className="mr-1 h-4 w-4" /> Tambah
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {specs.map((spec, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        placeholder="Atribut (cth: Daya)"
                                        value={spec.key}
                                        onChange={(e: { target: { value: string; }; }) => updateSpec(index, "key", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Nilai (cth: 15 kW)"
                                        value={spec.value}
                                        onChange={(e: { target: { value: string; }; }) => updateSpec(index, "value", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeSpec(index)}
                                        disabled={specs.length === 1}
                                        aria-label="Hapus spesifikasi"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Simpan Perubahan" : "Daftarkan Mesin"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}