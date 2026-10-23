const { initializeApp, deleteApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, updateDoc, runTransaction, serverTimestamp, terminate } = require('firebase/firestore');
const assert = require('node:assert/strict');
const clients = [];
function client(uid) {
  const app = initializeApp({ projectId: 'demo-castle-wars' }, uid);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8085, { mockUserToken: { sub: uid } });
  clients.push({ app, db }); return db;
}
const alice = client('alice'), bob = client('bob'), eve = client('eve');
const ref = db => doc(db, 'castleRooms', 'testroom');
const seat = uid => ({ uid, seen: serverTimestamp() });
const change = fields => ({ ...fields, updatedAt: serverTimestamp() });
async function denied(action) { await assert.rejects(action, err => err.code === 'permission-denied'); }
async function main() {
  await setDoc(ref(alice), { left: seat('alice'), right: null, state: '{}', turn: 'left', phase: 'waiting', shot: null, revision: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await updateDoc(ref(bob), change({ right: seat('bob') }));
  assert.equal((await getDoc(ref(eve))).data().right.uid, 'bob');
  await denied(updateDoc(ref(eve), change({ right: seat('eve') })));
  await denied(updateDoc(ref(alice), change({ right: seat('alice') })));
  await denied(updateDoc(ref(eve), change({ state: 'cheat' })));
  const shot = { id: 'shot-1', player: 'left', angle: -45, power: 100, before: '{}' };
  await denied(updateDoc(ref(bob), change({ phase: 'firing', shot })));
  await updateDoc(ref(alice), change({ phase: 'firing', shot }));
  await denied(updateDoc(ref(eve), change({ phase: 'waiting', shot: null, state: '{}', turn: 'right', revision: 1 })));
  await updateDoc(ref(bob), change({ phase: 'waiting', shot: null, state: '{"result":1}', turn: 'right', revision: 1 }));
  await denied(updateDoc(ref(alice), change({ phase: 'firing', shot: { ...shot, before: '{"result":1}' } })));
  await updateDoc(ref(bob), change({ right: null }));
  const attempts = await Promise.allSettled([bob, eve].map(db => runTransaction(db, async tx => {
    const snapshot = await tx.get(ref(db));
    if (snapshot.data().right) throw new Error('full');
    tx.update(ref(db), change({ right: seat(db === bob ? 'bob' : 'eve') }));
  })));
  assert.equal(attempts.filter(x => x.status === 'fulfilled').length, 1, 'only one concurrent join wins');
  await denied(setDoc(doc(eve, 'unrelated', 'private'), { public: true }));
  console.log('PASS: room capacity, concurrent joins, seat ownership, turn enforcement, shot completion and private collections');
}
main().catch(err => { console.error(err); process.exitCode = 1; }).finally(async () => {
  for (const { app, db } of clients) { await terminate(db); await deleteApp(app); }
});
