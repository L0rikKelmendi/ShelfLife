const { readFileSync } = require('node:fs');
const { after, before, beforeEach, describe, it } = require('node:test');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} = require('firebase/firestore');

let environment;
const item = () => ({
  name: 'Apples',
  quantity: 2,
  unit: 'pcs',
  category: 'Produce',
  storageLocation: 'Fridge',
  expiresOn: '2026-11-10',
  status: 'active',
  reminder: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
const ref = (db, uid = 'alice') => doc(db, 'users', uid, 'items', 'apple');

describe('Firestore rules against the real local emulator', () => {
  before(async () => {
    environment = await initializeTestEnvironment({
      projectId: 'demo-shelflife',
      firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    });
  });
  after(async () => {
    await environment?.cleanup();
  });
  beforeEach(async () => {
    await environment.clearFirestore();
  });
  it('allows the owner to create, read, update, query and delete', async () => {
    const db = environment.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(ref(db), item()));
    await assertSucceeds(getDoc(ref(db)));
    await assertSucceeds(getDocs(collection(db, 'users', 'alice', 'items')));
    await assertSucceeds(updateDoc(ref(db), { status: 'used', updatedAt: serverTimestamp() }));
    await assertSucceeds(deleteDoc(ref(db)));
  });
  it('blocks anonymous access and cross-account reads, queries and writes', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const anonymous = environment.unauthenticatedContext().firestore();
    await assertSucceeds(setDoc(ref(alice), item()));
    await assertFails(getDoc(ref(bob)));
    await assertFails(getDocs(collection(bob, 'users', 'alice', 'items')));
    await assertFails(updateDoc(ref(bob), { status: 'used', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(ref(bob)));
    await assertFails(setDoc(ref(bob, 'alice'), item()));
    await assertFails(getDoc(ref(anonymous)));
  });
  it('rejects invalid schema, quantities, statuses and forged timestamps', async () => {
    const db = environment.authenticatedContext('alice').firestore();
    await assertFails(setDoc(ref(db), { ...item(), quantity: -2 }));
    await assertFails(setDoc(ref(db), { ...item(), injected: true }));
    await assertFails(setDoc(ref(db), { ...item(), status: 'invented' }));
    await assertSucceeds(setDoc(ref(db), item()));
    await assertFails(
      updateDoc(ref(db), { createdAt: new Date(2000, 0, 1), updatedAt: serverTimestamp() }),
    );
  });
});
