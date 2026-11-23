"use client";

import { useRef } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Machine } from "@/lib/types";

interface QRPrintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    machine: Machine | null;
}

export function QRPrintDialog({
    open,
    onOpenChange,
    machine,
}: QRPrintDialogProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    if (!machine) return null;

    // URL publik untuk hasil scan QR (Dynamic QR).
    // Dibangun dari origin saat ini + query ?mesin={id}.
    // Dialog hanya terbuka via interaksi client → window pasti tersedia.
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const qrUrl = `${origin}/?mesin=${machine.id}`;

    const handlePrint = () => {
        const canvas = canvasRef.current;
        // Ambil data URL dari canvas QR asli (dapat di-scan)
        const dataUrl = canvas?.toDataURL("image/png") ?? "";
        if (!dataUrl) return;

        const printWindow = window.open("", "_blank", "width=520,height=680");
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Kartu QR - ${escapeHtml(machine.name)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex; align-items: center; justify-content: center;
              min-height: 100vh; padding: 24px; background: #fff;
            }
            .card {
              width: 380px; border: 2px solid #111827; border-radius: 16px;
              padding: 28px 24px; text-align: center;
            }
            .header {
              font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
              color: #6b7280; text-transform: uppercase; margin-bottom: 4px;
            }
            .title {
              font-size: 18px; font-weight: 800; color: #111827;
              margin-bottom: 2px; line-height: 1.3;
            }
            .code {
              font-size: 13px; font-weight: 600; color: #d97706;
              margin-bottom: 16px; font-family: monospace;
            }
            .qr img { width: 220px; height: 220px; }
            .footer {
              font-size: 11px; color: #6b7280; line-height: 1.5;
              border-top: 1px dashed #d1d5db; padding-top: 12px; margin-top: 16px;
            }
            .footer strong { color: #111827; }
            @media print {
              body { padding: 0; background: #fff; }
              @page { margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">Kartu Identitas Aset Mesin</div>
            <div class="title">${escapeHtml(machine.name)}</div>
            <div class="code">${escapeHtml(machine.code)}</div>
            <div class="qr">
              <img src="${dataUrl}" alt="QR Code ${escapeHtml(machine.code)}" />
            </div>
            <div class="footer">
              <strong>Petunjuk:</strong> Pindai QR Code dengan kamera HP<br/>
              untuk melihat detail &amp; form inspeksi mingguan.<br/>
              <strong>Lokasi:</strong> ${escapeHtml(machine.location)}
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generate &amp; Cetak QR Code</DialogTitle>
                    <DialogDescription>
                        Kartu QR berisi tautan ke halaman detail mesin. Cetak dan tempel
                        pada mesin — data selalu sinkron saat di-scan (Dynamic QR).
                    </DialogDescription>
                </DialogHeader>

                {/* Kartu preview QR */}
                <div className="flex justify-center py-2">
                    <div className="w-full max-w-xs rounded-2xl border-2 border-zinc-900 p-6 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Kartu Identitas Aset Mesin
                        </p>
                        <h3 className="mt-1 text-base font-extrabold leading-tight text-zinc-900 dark:text-zinc-100">
                            {machine.name}
                        </h3>
                        <p className="mb-3 font-mono text-xs font-semibold text-amber-600">
                            {machine.code}
                        </p>
                        <div className="flex justify-center">
                            <div className="rounded-lg bg-white p-2">
                                {origin ? (
                                    <>
                                        {/* Tampilan preview (SVG) */}
                                        <QRCodeSVG
                                            value={qrUrl}
                                            size={180}
                                            level="M"
                                        />
                                        {/* Canvas tersembunyi untuk dijadikan data URL saat cetak */}
                                        <div className="hidden">
                                            <QRCodeCanvas
                                                ref={canvasRef}
                                                value={qrUrl}
                                                size={256}
                                                level="M"
                                            />
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>
                        <p className="mt-3 border-t border-dashed border-zinc-300 pt-2 text-[10px] leading-snug text-muted-foreground">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                Petunjuk:
                            </span>{" "}
                            Pindai QR dengan kamera HP untuk melihat detail &amp; form inspeksi.
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                Lokasi:
                            </span>{" "}
                            {machine.location}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak QR
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}