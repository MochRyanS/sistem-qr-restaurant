import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Sistem Manajemen Aset & Inspeksi Mesin | Dynamic QR Code",
    description: "Kelola data mesin, cetak QR Code dinamis, dan catat laporan inspeksi mingguan secara digital. Saat data mesin di-update, info hasil scan QR otomatis berubah.",
    keywords: ["manajemen aset", "inspeksi mesin", "QR Code", "maintenance", "asset management", " industri"],
    authors: [{ name: "Asset Management System" }],
    icons: {
        icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
            >
                {children}
                <Toaster />
            </body>
        </html>
    );
}