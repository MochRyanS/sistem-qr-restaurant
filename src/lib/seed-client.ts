import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCZffY-sVmT5kkdsoBpskSjBRIvdegO0N8",
    authDomain: "sistem-qr-restaurant.firebaseapp.com",
    projectId: "sistem-qr-restaurant",
    storageBucket: "sistem-qr-restaurant.firebasestorage.app",
    messagingSenderId: "914366522707",
    appId: "1:914366522707:web:cb8ac5c6aa623f7f57ada6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PDF_CHECKLIST_ITEMS = [
    "CHOCOAL GAS W/TABLE GRILL", "GAS STREAMER 3 DECK", "GAS RANGE & BURNER W/OVEN",
    "OVEN COMBI STREAMER", "TILTING PAN", "BOILER PAN",
    "KWALI RANGE 2 BURNER HIGH PRESSURE", "STOCK POT RANGE MIDLE PRESSURE",
    "GAS RICE COOKER 3 DECK", "NODDLE MECHINE", "MEAT GRINDER", "ROBO COUPE",
    "MEAT SLICER", "DISWASHING MECHINE", "ICE CUBE MECHINE", "ICE CRUST MECHINE",
    "NODDLE BURNER", "GAS COMBINATION SOUP BURNER",
    "KWALI RANGE SINGLE BURNER", "MICROWAVE",
];

function slugify(label: string): string {
    return label.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

async function seedChecklistItems() {
    const existing = await getDocs(collection(db, "checklistItems"));
    if (!existing.empty) {
        console.log("⚠️  Checklist sudah ada data, skip.");
        return;
    }
    const usedKeys = new Set<string>();
    const now = Timestamp.now();
    for (let i = 0; i < PDF_CHECKLIST_ITEMS.length; i++) {
        const label = PDF_CHECKLIST_ITEMS[i];
        let key = slugify(label) || `item-${i + 1}`;
        let suffix = 1;
        while (usedKeys.has(key)) {
            key = `${slugify(label)}-${suffix}`;
            suffix++;
        }
        usedKeys.add(key);
        await setDoc(doc(db, "checklistItems", key), {
            key,
            label,
            order: i + 1,
            createdAt: now,
            updatedAt: now,
        });
    }
    console.log(`✅ Berhasil tambah ${PDF_CHECKLIST_ITEMS.length} item checklist.`);
}

async function seedMachines() {
    const existing = await getDocs(collection(db, "machines"));
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
    const now = Timestamp.now();
    for (const m of machines) {
        await setDoc(doc(db, "machines", m.code), {
            ...m,
            createdAt: now,
            updatedAt: now,
        });
    }
    console.log(`✅ Berhasil tambah ${machines.length} mesin contoh.`);
}

async function main() {
    console.log("🔥 Mulai seed (Client SDK)...");
    await seedChecklistItems();
    await seedMachines();
    console.log("\n🎉 Seed selesai! Cek Firebase Console → Firestore Database.");
}

main().catch((e) => {
    console.error("❌ Seed gagal:", e.message);
    process.exit(1);
});