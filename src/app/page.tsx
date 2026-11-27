"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { PublicMachineView } from "@/components/public/PublicMachineView";
import { LoginScreen } from "@/components/admin/LoginScreen";
import { isAuthenticated } from "@/lib/auth";

function AppRouter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const machineId = searchParams.get("mesin");
    const [authState, setAuthState] = useState<{ authed: boolean; checked: boolean }>({
        authed: false,
        checked: false,
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAuthState({ authed: isAuthenticated(), checked: true });
    }, []);

    const handleBackToAdmin = useCallback(() => {
        router.push("/");
    }, [router]);

    // Public view (QR scan) — no auth needed
    if (machineId) {
        return <PublicMachineView machineId={machineId} onBack={handleBackToAdmin} />;
    }

    if (!authState.checked) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-sm text-muted-foreground">Memuat...</div>
            </div>
        );
    }

    if (!authState.authed) {
        return <LoginScreen onSuccess={() => setAuthState({ authed: true, checked: true })} />;
    }

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