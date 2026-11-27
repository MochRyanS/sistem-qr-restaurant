"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Loader2, Upload, X, ImageIcon, ShieldCheck } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { createMachine, updateMachine } from "@/lib/api-client";
import type { Machine, MachineInput, MachineSpec, MachineStatus } from "@/lib/types";

interface MachineFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingMachine?: Machine | null;
    onSaved: (machine: Machine) => void;
}

const STATUS_OPTIONS: { value: MachineStatus; label: string }[] = [
    { value: "Normal", label: "Normal" },
    { value: "Perbaikan", label: "Perbaikan" },
    { value: "Rusak", label: "Rusak" },
];

async function compressImage(file: File, maxSize = 800, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxSize || height > maxSize) {
                    if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize; }
                    else { width = Math.round((width * maxSize) / height); height = maxSize; }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) { reject(new Error("Canvas tidak didukung.")); return; }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = () => reject(new Error("Gagal memuat gambar."));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Gagal membaca file."));
        reader.readAsDataURL(file);
    });
}

export function MachineFormModal({ open, onOpenChange, editingMachine, onSaved }: MachineFormModalProps) {
    const { toast } = useToast();
    const isEdit = Boolean(editingMachine);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [submitting, setSubmitting] = useState(false);
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [imageData, setImageData] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<MachineStatus>("Normal");
    const [preventiveDone, setPreventiveDone] = useState(false);
    const [preventiveTechnician, setPreventiveTechnician] = useState("");
    const [preventiveDate, setPreventiveDate] = useState("");
    const [preventiveNotes, setPreventiveNotes] = useState("");
    const [specs, setSpecs] = useState<MachineSpec[]>([{ key: "", value: "" }]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!open) return;
        if (editingMachine) {
            setCode(editingMachine.code); setName(editingMachine.name); setLocation(editingMachine.location);
            setDescription(editingMachine.description); setImageData(editingMachine.imageUrl);
            setStatus(editingMachine.status); setPreventiveDone(editingMachine.preventiveDone);
            setPreventiveTechnician(editingMachine.preventiveTechnician);
            setPreventiveDate(editingMachine.preventiveDate ? editingMachine.preventiveDate.split("T")[0] : "");
            setPreventiveNotes(editingMachine.preventiveNotes);
            setSpecs(editingMachine.specs.length > 0 ? editingMachine.specs : [{ key: "", value: "" }]);
        } else {
            setCode(""); setName(""); setLocation(""); setDescription(""); setImageData("");
            setStatus("Normal"); setPreventiveDone(false);
            setPreventiveTechnician(""); setPreventiveDate(""); setPreventiveNotes("");
            setSpecs([{ key: "", value: "" }]);
        }
    }, [open, editingMachine]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast({ title: "File tidak valid", description: "Pilih file gambar.", variant: "destructive" }); return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast({ title: "File terlalu besar", description: "Maks 10MB.", variant: "destructive" }); return;
        }
        setUploading(true);
        try {
            const compressed = await compressImage(file);
            setImageData(compressed);
            toast({ title: "Foto terunggah", description: "Gambar dikompres dan siap." });
        } catch (err) {
            toast({ title: "Gagal upload", description: err instanceof Error ? err.message : "Error.", variant: "destructive" });
        } finally { setUploading(false); }
    };

    const handleRemoveImage = () => { setImageData(""); if (fileInputRef.current) fileInputRef.current.value = ""; };
    const addSpec = () => setSpecs((prev) => [...prev, { key: "", value: "" }]);
    const removeSpec = (index: number) => setSpecs((prev) => prev.filter((_, i) => i !== index));
    const updateSpec = (index: number, field: keyof MachineSpec, value: string) =>
        setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !name.trim() || !location.trim()) {
            toast({ title: "Validasi gagal", description: "Kode, Nama, dan Lokasi wajib.", variant: "destructive" }); return;
        }
        const input: MachineInput = {
            code: code.trim(), name: name.trim(), location: location.trim(),
            description: description.trim(), imageUrl: imageData, status, preventiveDone,
            preventiveTechnician: preventiveTechnician.trim(), preventiveDate,
            preventiveNotes: preventiveNotes.trim(),
            specs: specs.filter((s) => s.key.trim()).map((s) => ({ key: s.key.trim(), value: s.value.trim() })),
        };
        setSubmitting(true);
        try {
            const saved = isEdit && editingMachine ? await updateMachine(editingMachine.id, input) : await createMachine(input);
            toast({ title: isEdit ? "Mesin diperbarui" : "Mesin ditambahkan", description: isEdit ? "Perubahan tersimpan." : `Mesin "${saved.name}" didaftarkan.` });
            onSaved(saved); onOpenChange(false);
        } catch (err) {
            toast({ title: "Gagal menyimpan", description: err instanceof Error ? err.message : "Error.", variant: "destructive" });
        } finally { setSubmitting(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Mesin" : "Tambah Mesin Baru"}</DialogTitle>
                    <DialogDescription>{isEdit ? "Perbarui data mesin." : "Lengkapi data mesin."}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="code">Kode / Nomor Aset <span className="text-red-500">*</span></Label>
                            <Input id="code" placeholder="cth: MCH-PRD-001" value={code} onChange={(e) => setCode(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Mesin <span className="text-red-500">*</span></Label>
                            <Input id="name" placeholder="cth: Mesin CNC Milling VMC-500" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="location">Lokasi Penempatan <span className="text-red-500">*</span></Label>
                            <Input id="location" placeholder="cth: Ruang Produksi A" value={location} onChange={(e) => setLocation(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status Mesin</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as MachineStatus)}>
                                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi Mesin</Label>
                        <Textarea id="description" placeholder="Deskripsikan mesin ini..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className={`h-5 w-5 ${preventiveDone ? "text-emerald-500" : "text-muted-foreground"}`} />
                            <div>
                                <Label className="cursor-pointer">Preventive Maintenance</Label>
                                <p className="text-xs text-muted-foreground">{preventiveDone ? "Sudah dilakukan preventive" : "Belum dilakukan preventive"}</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setPreventiveDone(!preventiveDone)} className={`relative h-6 w-11 rounded-full transition-colors ${preventiveDone ? "bg-emerald-500" : "bg-muted"}`}>
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${preventiveDone ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                    </div>

                    {preventiveDone && (
                        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="prev-tech">Nama Teknisi</Label>
                                    <Input id="prev-tech" placeholder="cth: Didi Sunardi" value={preventiveTechnician} onChange={(e) => setPreventiveTechnician(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="prev-date">Tanggal Preventive</Label>
                                    <Input id="prev-date" type="date" value={preventiveDate} onChange={(e) => setPreventiveDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="prev-notes">Catatan Preventive</Label>
                                <Textarea id="prev-notes" placeholder="Catatan hasil preventive..." value={preventiveNotes} onChange={(e) => setPreventiveNotes(e.target.value)} rows={2} />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Foto Mesin</Label>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="photo-upload" />
                        {imageData ? (
                            <div className="relative overflow-hidden rounded-lg border">
                                <img src={imageData} alt="Pratinjau" className="h-48 w-full object-cover" />
                                <button type="button" onClick={handleRemoveImage} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="photo-upload" className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 hover:border-amber-400 hover:bg-muted/50">
                                {uploading ? (<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />) : (
                                    <>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Upload className="h-5 w-5 text-muted-foreground" /></div>
                                        <p className="text-sm font-medium">Klik untuk upload foto</p>
                                        <p className="text-xs text-muted-foreground">JPG, PNG, WebP — maks 10MB</p>
                                    </>
                                )}
                            </label>
                        )}
                        {!imageData && (<p className="text-xs text-muted-foreground">Foto akan tampil di kartu QR & halaman inspeksi.</p>)}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Spesifikasi Mesin</Label>
                                <p className="text-xs text-muted-foreground">Tambahkan atribut teknis (Daya, Kapasitas, Tahun, dll).</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addSpec}><Plus className="mr-1 h-4 w-4" /> Tambah</Button>
                        </div>
                        <div className="space-y-2">
                            {specs.map((spec, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input placeholder="Atribut (cth: Daya)" value={spec.key} onChange={(e) => updateSpec(index, "key", e.target.value)} className="flex-1" />
                                    <Input placeholder="Nilai (cth: 15 kW)" value={spec.value} onChange={(e) => updateSpec(index, "value", e.target.value)} className="flex-1" />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(index)} disabled={specs.length === 1} aria-label="Hapus spesifikasi">
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
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