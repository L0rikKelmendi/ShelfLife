import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { cleanItem } from '../lib/items';
import { db } from './firebase';

function itemsCollection(uid) {
  if (!db || !uid) throw new Error('Sign in before opening your pantry.');
  return collection(db, 'users', uid, 'items');
}
export function watchItems(uid, onChange, onError) {
  return onSnapshot(
    itemsCollection(uid),
    (snapshot) => {
      onChange(snapshot.docs.map((record) => ({ ...record.data(), id: record.id })));
    },
    onError,
  );
}
export async function createItem(uid, values) {
  const data = {
    ...cleanItem(values),
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const record = await addDoc(itemsCollection(uid), data);
  return record.id;
}
export async function editItem(uid, id, values) {
  itemsCollection(uid);
  await updateDoc(doc(db, 'users', uid, 'items', id), {
    ...cleanItem(values),
    updatedAt: serverTimestamp(),
  });
}
export async function changeItemStatus(uid, id, status) {
  if (!['active', 'used', 'wasted'].includes(status)) throw new Error('Invalid item status.');
  itemsCollection(uid);
  await updateDoc(doc(db, 'users', uid, 'items', id), { status, updatedAt: serverTimestamp() });
}
export async function removeItem(uid, id) {
  itemsCollection(uid);
  await deleteDoc(doc(db, 'users', uid, 'items', id));
}
