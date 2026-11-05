const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, deleteUser } = require('firebase/auth');
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  setLogLevel,
  terminate,
  updateDoc,
} = require('firebase/firestore');

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1).trim()];
    }),
);
const config = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const apps = [initializeApp(config, `owner-${suffix}`), initializeApp(config, `other-${suffix}`)];
const auths = apps.map((app) => getAuth(app));
const databases = apps.map((app) => getFirestore(app));
let record;

async function denied(promise) {
  await assert.rejects(promise, (error) => error.code === 'permission-denied');
}

async function main() {
  setLogLevel('silent');
  try {
    for (let index = 0; index < 2; index++) {
      await createUserWithEmailAndPassword(
        auths[index],
        `shelflife-rules-${index}-${suffix}@example.test`,
        `Fresh-${suffix}!`,
      );
    }
    const uid = auths[0].currentUser.uid;
    record = doc(databases[0], 'users', uid, 'items', 'cloud-rules-check');
    const otherRef = doc(databases[1], 'users', uid, 'items', 'cloud-rules-check');
    const values = {
      name: 'Temporary verification apples',
      quantity: 2,
      unit: 'pcs',
      category: 'Produce',
      storageLocation: 'Fridge',
      expiresOn: '2026-12-20',
      status: 'active',
      reminder: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(record, values);
    assert.equal((await getDoc(record)).data().quantity, 2);
    await updateDoc(record, { quantity: 3, updatedAt: serverTimestamp() });
    assert.equal((await getDoc(record)).data().quantity, 3);
    await denied(getDoc(otherRef));
    await denied(getDocs(collection(databases[1], 'users', uid, 'items')));
    await denied(updateDoc(otherRef, { quantity: 9, updatedAt: serverTimestamp() }));
    await denied(deleteDoc(otherRef));
    await denied(updateDoc(record, { quantity: -1, updatedAt: serverTimestamp() }));
    await deleteDoc(record);
    record = null;
  } finally {
    if (record) await deleteDoc(record).catch(() => {});
    for (const auth of auths) if (auth.currentUser) await deleteUser(auth.currentUser);
    for (const database of databases) await terminate(database);
    await Promise.all(apps.map(deleteApp));
  }
  fs.mkdirSync('.local/checks', { recursive: true });
  fs.writeFileSync(
    '.local/checks/firebase-cloud-rules-checks.json',
    JSON.stringify(
      {
        environment: 'Deployed Cloud Firestore rules, real Firebase client identities',
        projectId: config.projectId,
        passed: true,
        checks: [
          'owner create/read/update/delete',
          'cross-account read denial',
          'cross-account query denial',
          'cross-account update/delete denial',
          'invalid quantity denial',
        ],
        temporaryAccountsDeleted: true,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('PASS live cloud ownership and schema checks');
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
