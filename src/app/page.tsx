"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { PublicMachineView } from "@/components/public/PublicMachineView";

/**
 * View Router — Single Page Application dengan conditional view.
 *
 * Routing berbasis query param (tanpa membuat route baru):
 * - `/`                → Admin Dashboard
 * - `/?mesin={id}`     → Public Machine View (hasil scan QR Code, mobile-first)
 *
 * Konsep Dynamic QR: QR Code men-encode URL `/?mesin={id}`.
 * Saat data mesin di-edit di admin, halaman public otomatis menampilkan
 * info terbaru karena data selalu di-fetch dari server saat diakses.
 *
 * Catatan: Suspense boundary di bawah menangani perbedaan SSR/client
 * untuk useSearchParams() sehingga tidak terjadi hydration mismatch.
 */
function AppRouter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const machineId = searchParams.get("mesin");

    const handleBackToAdmin = useCallback(() => {
        router.push("/");
    }, [router]);

    // View public (hasil scan QR) jika query ?mesin ada
    if (machineId) {
        return (
            <PublicMachineView machineId={machineId} onBack={handleBackToAdmin} />
        );
    }

    // Default: Admin Dashboard
    return <AdminDashboard />;
}

export default function Home() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-sm text-muted-foreground">Memuat...</div>
                </div>
            }
        >
            <AppRouter />
        </Suspense>
    );
}