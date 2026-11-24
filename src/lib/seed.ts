import * as fs from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { slugifyKey } from "@/lib/types";

// Baca service account langsung dari file JSON (bypass env var)
const files = fs.readdirSync(".").filter(
    (f) => f.includes("firebase-adminsdk") && f.endsWith(".json")
);
if (files.length === 0) {
    console.error("❌ File JSON Firebase tidak ditemukan di root proyek!");
    console.error("   Pastikan file *-firebase-adminsdk-*.json ada di folder ini.");
    process.exit(1);
}

console.log("📄 Membaca:", files[0]);
const serviceAccount = JSON.parse(fs.readFileSync(files[0], "utf8"));

if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
}

const firestore = getFirestore();
firestore.settings({ preferRest: true });

const PDF_CHECKLIST_ITEMS = [
    "CHOCOAL GAS W/TABLE GRILL", "GAS STREAMER 3 DECK", "GAS RANGE & BURNER W/OVEN",
    "OVEN COMBI STREAMER", "TILTING PAN", "BOILER PAN",
    "KWALI RANGE 2 BURNER HIGH PRESSURE", "STOCK POT RANGE MIDLE PRESSURE",
    "GAS RICE COOKER 3 DECK", "NODDLE MECHINE", "MEAT GRINDER", "ROBO COUPE",
    "MEAT SLICER", "DISWASHING MECHINE", "ICE CUBE MECHINE", "ICE CRUST MECHINE",
    "NODDLE BURNER", "GAS COMBINATION SOUP BURNER",
    "KWALI RANGE SINGLE BURNER", "MICROWAVE",
];

async function seedChecklistItems() {
    const existing = await firestore.collection("checklistItems").limit(1).get();
    if (!existing.empty) {
        console.log("⚠️  Checklist sudah ada data, skip.");
        return;
    }
    const usedKeys = new Set<string>();
    const batch = firestore.batch();
    const now = Timestamp.now();
    for (let i = 0; i < PDF_CHECKLIST_ITEMS.length; i++) {
        const label = PDF_CHECKLIST_ITEMS[i];
        let key = slugifyKey(label) || `item-${i + 1}`;
        let suffix = 1;
        while (usedKeys.has(key)) {
            key = `${slugifyKey(label)}-${suffix}`;
            suffix++;
        }
        usedKeys.add(key);
        const ref = firestore.collection("checklistItems").doc();
        batch.set(ref, { key, label, order: i + 1, createdAt: now, updatedAt: now });
    }
    await batch.commit();
    console.log(`✅ Berhasil tambah ${PDF_CHECKLIST_ITEMS.length} item checklist.`);
}

async function seedMachines() {
    const existing = await firestore.collection("machines").limit(1).get();
    if (!existing.empty) {
        console.log("⚠️  Machines sudah ada data, skip.");
        return;
    }
    const machines = [
        {
            code: "MCH-PRD-001", name: "Mesin CNC Milling VMC-500", location: "Ruang Produksi A",
            specs: [{ key: "Daya", value: "15 kW" }, { key: "Kapasitas", value: "500x400x300 mm" }, { key: "Tahun", value: "2021" }],
            imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
            status: "Normal",
        },
        {
            code: "MCH-PRD-002", name: "Mesin Injection Molding JSW-180", location: "Ruang Produksi B",
            specs: [{ key: "Daya", value: "22 kW" }, { key: "Kapasitas", value: "180 ton" }, { key: "Tahun", value: "2020" }],
            imageUrl: "https://images.unsplash.com/photo-1565043666747-4965a42a9b52?w=800&q=80",
            status: "Perbaikan",
        },
        {
            code: "MCH-UTL-003", name: "Kompressor Udara Atlas Copco GA-75", location: "Ruang Utilitas",
            specs: [{ key: "Daya", value: "75 kW" }, { key: "Kapasitas", value: "13 m³/min" }, { key: "Tahun", value: "2019" }],
            imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80",
            status: "Normal",
        },
    ];
    const batch = firestore.batch();
    const now = Timestamp.now();
    for (const m of machines) {
        const ref = firestore.collection("machines").doc();
        batch.set(ref, { ...m, createdAt: now, updatedAt: now });
    }
    await batch.commit();
    console.log(`✅ Berhasil tambah ${machines.length} mesin contoh.`);
}

async function main() {
    console.log("🔥 Mulai seed ke Firestore...");
    await seedChecklistItems();
    await seedMachines();
    console.log("\n🎉 Seed selesai! Cek Firebase Console → Firestore Database.");
}

main().catch((e) => {
    console.error("❌ Seed gagal:", e.message);
    process.exit(1);
});