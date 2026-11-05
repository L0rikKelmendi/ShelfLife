#!/usr/bin/env node
// Synthetic month of sample records in a dedicated presentation account.
// Credentials stay in ignored/local files; no other account is changed.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { initializeApp, deleteApp } = require('firebase/app');
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} = require('firebase/auth');
const { getFirestore, collection, getDocs, terminate } = require('firebase/firestore');
const { getAccessToken } = require('firebase-tools/lib/auth');
const foods = require('../src/lib/foods.json');
process.chdir(path.resolve(__dirname, '..'));
const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1).trim()];
    }),
);
const config = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const credentialPath = '.local/presentation-account.json';
const app = initializeApp(config, 'presentation-seed');
const auth = getAuth(app);
const db = getFirestore(app);
const date = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const instant = (offset, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};
function encode(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'boolean'
        ? { booleanValue: value }
        : typeof value === 'number'
          ? { doubleValue: value }
          : key.endsWith('At')
            ? { timestampValue: value }
            : { stringValue: value },
    ]),
  );
}
async function main() {
  fs.mkdirSync('.local', { recursive: true });
  let account;
  if (fs.existsSync(credentialPath)) {
    account = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
    await signInWithEmailAndPassword(auth, account.email, account.password);
    if (auth.currentUser.uid !== account.uid) throw new Error('Presentation account mismatch.');
  } else {
    account = {
      email: `lorik.demo.${Date.now()}@example.test`,
      password: 'ShelfLife!' + crypto.randomBytes(12).toString('base64url'),
    };
    const result = await createUserWithEmailAndPassword(auth, account.email, account.password);
    account.uid = result.user.uid;
    await updateProfile(result.user, { displayName: 'Lorik Demo' });
    fs.writeFileSync(credentialPath, JSON.stringify(account, null, 2) + '\n', { mode: 0o600 });
  }
  const cli = JSON.parse(
    fs.readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'),
  );
  const token = await getAccessToken(cli.tokens.refresh_token, [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/firebase',
  ]);
  const existing = await getDocs(collection(db, 'users', account.uid, 'items'));
  const items = [];
  const core = foods.slice(0, 52);
  const quantity = (food) =>
    food.unit === 'g' ? 250 : food.unit === 'ml' ? 500 : ['l', 'kg'].includes(food.unit) ? 1 : 2;
  const info = (food) =>
    Object.fromEntries(
      ['name', 'category', 'unit', 'storageLocation'].map((key) => [key, food[key]]),
    );
  const at = (offset, hour, slot = 0) => {
    const value = new Date(instant(offset, hour));
    return new Date(
      Math.min(value.getTime() + slot * 60000, Date.now() - (slot + 1) * 180000),
    ).toISOString();
  };
  for (let day = 29; day >= 0; day--) {
    for (let slot = 0; slot < 12; slot++) {
      const food = core[(day * 7 + slot * 11) % core.length];
      const status = (day * 3 + slot) % 9 === 0 ? 'wasted' : 'used';
      items.push({
        id: `demo-month-day-${day}-item-${slot}`,
        ...info(food),
        quantity: quantity(food),
        expiresOn: date(-day + (status === 'used' ? 1 : -1)),
        status,
        reminder: false,
        createdAt: at(-day - 3, 10),
        updatedAt: at(-day, 9 + (slot % 10), slot),
      });
    }
  }
  foods.slice(0, 90).forEach((food, index) => {
    const offset =
      index < 3 ? index - 3 : index < 7 ? 0 : index < 13 ? (index % 3) + 1 : 4 + (index % 38);
    items.push({
      id: `demo-current-${food.id}`,
      ...info(food),
      quantity: quantity(food),
      expiresOn: date(offset),
      status: 'active',
      reminder: offset >= 2 && offset <= 7,
      createdAt: at(-((index % 7) + 1), 10),
      updatedAt: at(-1, 18),
    });
  });
  const prefix = `projects/${config.projectId}/databases/(default)/documents/users/${account.uid}/items/`;
  const wanted = new Set(items.map((item) => item.id));
  const writes = existing.docs
    .filter((record) => /^(demo-month-|demo-current-)/.test(record.id) && !wanted.has(record.id))
    .map((record) => ({ delete: prefix + record.id }));
  writes.push(
    ...items.map(({ id, ...data }) => ({ update: { name: prefix + id, fields: encode(data) } })),
  );
  for (let start = 0; start < writes.length; start += 100) {
    const result = await fetch(
      `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ writes: writes.slice(start, start + 100) }),
      },
    );
    if (!result.ok) throw new Error(`Sample dataset write failed (${result.status}).`);
  }
  const saved = await getDocs(collection(db, 'users', account.uid, 'items'));
  if (saved.size < items.length) throw new Error('Presentation item count mismatch.');
  const report = {
    seededAt: new Date().toISOString(),
    purpose: 'Synthetic one-month presentation dataset, not actual usage history',
    displayName: 'Lorik Demo',
    records: saved.size,
    seededRecords: items.length,
    accountEmail: account.email,
    history: items.filter((i) => i.status !== 'active').length,
    active: items.filter((i) => i.status === 'active').length,
    enjoyed: items.filter((i) => i.status === 'used').length,
    discarded: items.filter((i) => i.status === 'wasted').length,
    ownerReadVerified: true,
  };
  fs.mkdirSync('.local/checks', { recursive: true });
  fs.writeFileSync('.local/checks/demo-data.json', JSON.stringify(report, null, 2) + '\n');
  console.log(`Presentation account ready: ${saved.size} synthetic records. Credentials: ${credentialPath}`);
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await terminate(db);
    await deleteApp(app);
  });
