const fs = require('fs');

// Cari file JSON service account Firebase
const files = fs.readdirSync('.').filter(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
if (files.length === 0) {
    console.log('ERROR: File JSON Firebase tidak ditemukan di folder ini!');
    console.log('Pastikan file *-firebase-adminsdk-*.json ada di root proyek.');
    process.exit(1);
}

console.log('Membaca file:', files[0]);
const k = JSON.parse(fs.readFileSync(files[0], 'utf8'));

// Convert actual newlines ke literal \n untuk format .env
const privateKey = k.private_key.replace(/\n/g, '\\n');

// Tulis .env.local dengan format BENAR
const content = 'FIREBASE_PROJECT_ID=' + k.project_id + '\n' +
    'FIREBASE_CLIENT_EMAIL=' + k.client_email + '\n' +
    'FIREBASE_PRIVATE_KEY="' + privateKey + '"\n';

fs.writeFileSync('.env.local', content);

console.log('\n✅ .env.local berhasil dibuat!');
console.log('\nIsi file:');
console.log('FIREBASE_PROJECT_ID=' + k.project_id);
console.log('FIREBASE_CLIENT_EMAIL=' + k.client_email);
console.log('FIREBASE_PRIVATE_KEY="' + privateKey.substring(0, 50) + '...(panjang)...' + privateKey.substring(privateKey.length - 30) + '"');