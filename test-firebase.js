const fs = require('fs');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Cari file JSON service account
const files = fs.readdirSync('.').filter(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
if (files.length === 0) {
    console.log('❌ JSON tidak ditemukan!');
    process.exit(1);
}

console.log('📄 File:', files[0]);
const sa = JSON.parse(fs.readFileSync(files[0], 'utf8'));
console.log('Project ID:', sa.project_id);
console.log('Client Email:', sa.client_email);
console.log('Key mulai:', sa.private_key.substring(0, 40));
console.log('Key akhir:', sa.private_key.substring(sa.private_key.length - 30));
console.log('Key panjang:', sa.private_key.length, 'karakter');

// Test koneksi
initializeApp({ credential: cert(sa) });
const db = getFirestore();

console.log('\n🔄 Test koneksi Firestore...');
db.collection('test').limit(1).get()
    .then(() => {
        console.log('✅ Firebase terhubung! Kredensial valid.');
        process.exit(0);
    })
    .catch(e => {
        console.log('❌ Error:', e.message);
        process.exit(1);
    });