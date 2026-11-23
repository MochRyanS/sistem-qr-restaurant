import { db } from "@/lib/db";
import { slugifyKey } from "@/lib/types";

/** 20 item komponen dari PDF "FORM CHECKLIST EQUIPMENT ITEM RAINFOREST" */
const PDF_CHECKLIST_ITEMS = [
    "CHOCOAL GAS W/TABLE GRILL",
    "GAS STREAMER 3 DECK",
    "GAS RANGE & BURNER W/OVEN",
    "OVEN COMBI STREAMER",
    "TILTING PAN",
    "BOILER PAN",
    "KWALI RANGE 2 BURNER HIGH PRESSURE",
    "STOCK POT RANGE MIDLE PRESSURE",
    "GAS RICE COOKER 3 DECK",
    "NODDLE MECHINE",
    "MEAT GRINDER",
    "ROBO COUPE",
    "MEAT SLICER",
    "DISWASHING MECHINE",
    "ICE CUBE MECHINE",
    "ICE CRUST MECHINE",
    "NODDLE BURNER",
    "GAS COMBINATION SOUP BURNER",
    "KWALI RANGE SINGLE BURNER",
    "MICROWAVE",
];

async function seedChecklistItems() {
    const count = await db.checklistItem.count();
    if (count > 0) {
        console.log(`Checklist sudah berisi ${count} item. Seed item dilewati.`);
        return;
    }

    const usedKeys = new Set<string>();
    for (let i = 0; i < PDF_CHECKLIST_ITEMS.length; i++) {
        const label = PDF_CHECKLIST_ITEMS[i];
        // Pastikan key unik — jika slug tabrakan, tambahkan suffix angka
        let key = slugifyKey(label) || `item-${i + 1}`;
        let suffix = 1;
        while (usedKeys.has(key)) {
            key = `${slugifyKey(label)}-${suffix}`;
            suffix++;
        }
        usedKeys.add(key);

        await db.checklistItem.create({
            data: {
                key,
                label,
                order: i + 1,
            },
        });
    }
    console.log(`Berhasil menambahkan ${PDF_CHECKLIST_ITEMS.length} item checklist dari PDF.`);
}

async function seedMachines() {
    const count = await db.machine.count();
    if (count > 0) {
        console.log(`Database sudah berisi ${count} mesin. Seed mesin dilewati.`);
        return;
    }

    const machines = [
        {
            code: "MCH-PRD-001",
            name: "Mesin CNC Milling VMC-500",
            location: "Ruang Produksi A",
            specs: JSON.stringify([
                { key: "Daya", value: "15 kW" },
                { key: "Kapasitas", value: "500x400x300 mm" },
                { key: "Tahun Pembuatan", value: "2021" },
                { key: "Merk", value: "Mazak" },
                { key: "Spindle Speed", value: "12000 RPM" },
            ]),
            imageUrl:
                "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
            status: "Normal",
        },
        {
            code: "MCH-PRD-002",
            name: "Mesin Injection Molding JSW-180",
            location: "Ruang Produksi B",
            specs: JSON.stringify([
                { key: "Daya", value: "22 kW" },
                { key: "Kapasitas", value: "180 ton clamping" },
                { key: "Tahun Pembuatan", value: "2020" },
                { key: "Merk", value: "JSW" },
                { key: "Shot Weight", value: "450 g" },
            ]),
            imageUrl:
                "https://images.unsplash.com/photo-1565043666747-4965a42a9b52?w=800&q=80",
            status: "Perbaikan",
        },
        {
            code: "MCH-UTL-003",
            name: "Kompressor Udara Atlas Copco GA-75",
            location: "Ruang Utilitas",
            specs: JSON.stringify([
                { key: "Daya", value: "75 kW" },
                { key: "Kapasitas", value: "13 m³/min" },
                { key: "Tahun Pembuatan", value: "2019" },
                { key: "Merk", value: "Atlas Copco" },
                { key: "Tekanan Maks", value: "10 bar" },
            ]),
            imageUrl:
                "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80",
            status: "Normal",
        },
    ];

    for (const m of machines) {
        await db.machine.create({ data: m });
    }

    console.log(`Berhasil menambahkan ${machines.length} mesin contoh.`);
}

async function main() {
    await seedChecklistItems();
    await seedMachines();
}

main()
    .catch((e) => {
        console.error("Seed gagal:", e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });