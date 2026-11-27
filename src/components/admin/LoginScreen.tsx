"use client";

import { useState } from "react";
import { Factory, Loader2, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { login } from "@/lib/auth";

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
    const { toast } = useToast();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await new Promise((r) => setTimeout(r, 300));
        if (login(username.trim(), password)) {
            toast({ title: "Login berhasil", description: "Selamat datang, Admin!" });
            onSuccess();
        } else {
            toast({ title: "Login gagal", description: "Username atau password salah.", variant: "destructive" });
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900 text-amber-400">
                        <Factory className="h-7 w-7" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Manajemen Aset Mesin</CardTitle>
                        <p className="text-xs text-muted-foreground">Sistem Inspeksi Berbasis Dynamic QR Code</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input id="username" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-9" autoComplete="off" required />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                            Login Admin
                        </Button>
                        <div className="rounded-lg bg-muted/50 p-2 text-center text-[10px] text-muted-foreground">
                            Default: <strong>admin</strong> / <strong>admin123</strong>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}