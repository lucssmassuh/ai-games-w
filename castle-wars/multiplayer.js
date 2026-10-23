import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { getAuth, signInAnonymously, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { getFirestore, collection, doc, query, orderBy, where, Timestamp, onSnapshot, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { activeSeat, occupancy, availableSide, roomCode, ROOM_MS } from './rooms.mjs';

const $ = id => document.getElementById(id);
const game = window.castleGame;
const initial = game.snapshot();
const app = initializeApp(firebaseConfig, 'castle-wars');
const db = getFirestore(app);
const auth = getAuth(app);
let uid, roomRef, room, side, unsubscribe, listUnsubscribe, rooms = [];
let lastState = null, listKey, finishRetryAt = 0;
let shotId = null, finishing = false, pending = false, connected = false, local = false;
let heartbeat, leaving = false, pulsePending = false;
const message = text => { $('message').textContent = text; };
function error(err) {
    console.error(err);
    if (roomRef) $('connection').textContent = err.message || 'Connection failed. Try again.';
    message(err.code === 'permission-denied' ? 'Multiplayer access is unavailable. Check the Castle Wars database rules.' :
        err.code === 'auth/operation-not-allowed' ? 'Online play needs anonymous sign-in enabled in Firebase.' : err.message || 'Unable to connect. Please try again.');
}
function busy(value) {
    pending = value;
    $('create').disabled = $('join').disabled = value || !uid || !connected;
}
function link(id) {
    const url = new URL('index.html', location.href);
    url.searchParams.set('room', id);
    return url.href;
}
function renderRooms() {
    const root = $('rooms');
    const open = rooms.filter(r => r.phase !== 'finished' && occupancy(r) < 2 && r.createdAt?.toMillis() > Date.now() - ROOM_MS);
    const key = JSON.stringify([pending, connected, open.map(item => [item.id, occupancy(item)])]);
    if (key === listKey) return;
    listKey = key;
    root.replaceChildren();
    if (!open.length) root.textContent = 'No open games yet. Create one and invite a friend!';
    for (const item of open) {
        const row = document.createElement('div'); row.className = 'room';
        const label = document.createElement('div');
        label.textContent = `Room ${item.id}`;
        const count = document.createElement('small'); count.textContent = `${occupancy(item)}/2 players · Waiting for a challenger`;
        label.append(count);
        const button = document.createElement('button');
        const seat = availableSide(item, uid);
        button.textContent = seat === 'left' ? 'Join as P1 · Left' : 'Join as P2 · Right';
        button.disabled = pending || !connected;
        button.onclick = () => perform(() => joinRoom(item.id));
        row.append(label, button); root.append(row);
    }
}
function renderMatch() {
    if (!roomRef || !room) return;
    const count = occupancy(room);
    $('player-identity').hidden = false;
    $('player-identity').dataset.side = side;
    $('player-identity').textContent = side === 'left'
        ? 'YOU ARE P1 · LEFT CASTLE · W/S aim · Hold Q to fire'
        : 'YOU ARE P2 · RIGHT CASTLE · O/L aim · Hold P to fire';
    $('match-status').textContent = `Room ${roomRef.id} · ${count}/2 players · ` +
        (room.phase === 'finished' ? `${game.winner === 'left' ? 'Player 1' : 'Player 2'} wins! Create a new room to play again.` :
        count < 2 ? 'Waiting for an opponent — share the invite link' :
        room.phase === 'firing' ? 'Cannonball in flight…' : room.turn === side ? 'Your turn' : "Opponent’s turn");
    $('aim-up').dataset.key = side === 'right' ? 'o' : 'w';
    $('aim-down').dataset.key = side === 'right' ? 'l' : 's';
    $('fire').dataset.key = side === 'right' ? 'p' : 'q';
}
async function perform(action) {
    if (pending) return;
    busy(true); message('');
    try { await action(); } catch (err) { error(err); }
    finally { busy(false); renderRooms(); }
}
async function joinRoom(id, create = false) {
    if (roomRef) await leaveRoom();
    const ref = doc(db, 'castleRooms', id);
    await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        if (create) {
            if (snapshot.exists()) throw new Error('Room already exists. Try again.');
            tx.set(ref, { left: { uid, seen: serverTimestamp() }, right: null,
                state: initial, turn: 'left', phase: 'waiting', shot: null, revision: 0,
                createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        } else {
            if (!snapshot.exists()) throw new Error('Room not found. Create a new game.');
            const data = snapshot.data();
            if (data.phase === 'finished' || data.createdAt.toMillis() < Date.now() - ROOM_MS) throw new Error('This game has ended or expired. Create a new one.');
            const seat = availableSide(data, uid);
            if (!seat) throw new Error('This room is full. Choose another open game.');
            tx.update(ref, { [seat]: { uid, seen: serverTimestamp() }, updatedAt: serverTimestamp() });
        }
    });
    roomRef = ref; shotId = null; lastState = null; local = false; $('copy-link').hidden = false;
    $('lobby').hidden = true; $('room-tools').hidden = false;
    history.replaceState(null, '', link(id));
    unsubscribe = onSnapshot(ref, { includeMetadataChanges: true }, snapshot => {
        if (!snapshot.exists()) { error(new Error('This room no longer exists.')); return; }
        connected = !snapshot.metadata.fromCache;
        room = snapshot.data({ serverTimestamps: 'estimate' });
        side = ['left', 'right'].find(s => room[s]?.uid === uid);
        if (!side) {
            // A newly joined tab may first receive its pre-transaction cached room.
            if (leaving || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
            detach(); $('lobby').hidden = false;
            message('Your seat was released after disconnecting. Join an open room to play.'); return;
        }
        if (room.phase === 'firing' && room.shot && shotId !== room.shot.id) {
            shotId = room.shot.id;
            game.replay(room.shot);
        } else if (room.phase !== 'firing' && (lastState !== room.state || shotId)) {
            game.load(room.state); lastState = room.state; shotId = null;
        }
        $('connection').textContent = connected ? 'Online' : 'Reconnecting…';
        renderMatch();
    }, err => { connected = false; error(err); });
    heartbeat = setInterval(() => pulse().catch(error), 12_000);
}
async function pulse() {
    if (!roomRef || !side || !navigator.onLine || pulsePending) return;
    const ref = roomRef;
    pulsePending = true;
    try {
        await runTransaction(db, async tx => {
            const snap = await tx.get(ref); const data = snap.data();
            if (data?.[side]?.uid === uid) tx.update(ref, { [side]: { uid, seen: serverTimestamp() }, updatedAt: serverTimestamp() });
        });
    } finally { pulsePending = false; }
}
function detach() {
    unsubscribe?.(); clearInterval(heartbeat);
    roomRef = room = side = null; shotId = null;
    $('room-tools').hidden = true;
    $('player-identity').hidden = true;
    history.replaceState(null, '', new URL('index.html', location.href));
}
async function leaveRoom() {
    leaving = true;
    try {
        if (roomRef && side) {
            const ref = roomRef, seat = side;
            await runTransaction(db, async tx => {
                const snap = await tx.get(ref);
                if (snap.data()?.[seat]?.uid === uid) tx.update(ref, { [seat]: null, updatedAt: serverTimestamp() });
            });
        }
        document.getElementById('game-over')?.remove();
        detach(); local = false; $('copy-link').hidden = false; game.load(initial);
        $('lobby').hidden = false; $('match-status').textContent = 'Choose a game';
    } finally { leaving = false; }
}
window.castleNetwork = {
    get online() { return !local; },
    get playerSide() { return local ? null : side; },
    canControl(player) {
        return local || !!(roomRef && connected && !pending && !finishing && room?.phase === 'waiting' &&
            occupancy(room) === 2 && side === player && room.turn === side && activeSeat(room[side]));
    },
    async shoot(angle, power) {
        if (!this.canControl(side)) return;
        await perform(async () => {
            const ref = roomRef, player = side;
            await runTransaction(db, async tx => {
                const snap = await tx.get(ref); const data = snap.data();
                if (data.phase !== 'waiting' || data.turn !== player || data[player]?.uid !== uid || occupancy(data) !== 2) throw new Error('Wait for your turn and both players to connect.');
                tx.update(ref, { phase: 'firing', shot: { id: crypto.randomUUID(), player, angle, power, before: data.state }, updatedAt: serverTimestamp() });
            });
        });
    },
    settled() {
        if (!roomRef || !connected || room?.phase !== 'firing' || !shotId || !game.idle || finishing || Date.now() < finishRetryAt) return;
        // Either participant can finish a persisted shot, including after the shooter disconnects.
        finishing = true;
        const ref = roomRef, id = shotId, state = game.snapshot(), winner = game.winner;
        runTransaction(db, async tx => {
            const snap = await tx.get(ref); const data = snap.data();
            if (data.phase === 'firing' && data.shot.id === id) {
                tx.update(ref, { state, turn: data.turn === 'left' ? 'right' : 'left',
                    phase: winner ? 'finished' : 'waiting', shot: null, revision: data.revision + 1, updatedAt: serverTimestamp() });
            }
        }).catch(err => { finishRetryAt = Date.now() + 3000; error(err); }).finally(() => { finishing = false; });
    }
};
$('create').onclick = () => perform(() => joinRoom(doc(collection(db, 'castleRooms')).id, true));
$('join-form').onsubmit = event => { event.preventDefault(); perform(() => joinRoom(roomCode($('room-code').value))); };
$('leave').onclick = () => perform(leaveRoom);
$('copy-link').onclick = async () => {
    try { await navigator.clipboard.writeText(link(roomRef.id)); $('copy-link').textContent = 'Link copied!'; }
    catch { window.prompt('Copy this invite link:', link(roomRef.id)); }
};
$('local').onclick = () => {
    local = true; game.load(initial); $('aim-up').dataset.key = 'w'; $('aim-down').dataset.key = 's'; $('fire').dataset.key = 'q'; $('lobby').hidden = true;
    $('match-status').textContent = 'Same device · P1: W/S + Q · P2: O/L + P';
    $('room-tools').hidden = false; $('copy-link').hidden = true;
};
// Pointer controls work on touch screens and release safely if a pointer is cancelled.
for (const button of document.querySelectorAll('#mobile-controls button')) {
    let key, repeat;
    const stop = () => { clearInterval(repeat); if (key) document.dispatchEvent(new KeyboardEvent('keyup', { key })); key = null; };
    button.onpointerdown = event => {
        event.preventDefault(); button.setPointerCapture(event.pointerId);
        key = button.dataset.key;
        document.dispatchEvent(new KeyboardEvent('keydown', { key }));
        if (key !== 'q' && key !== 'p') repeat = setInterval(() => document.dispatchEvent(new KeyboardEvent('keydown', { key })), 120);
    };
    button.onpointerup = button.onpointercancel = button.onlostpointercapture = stop;
}
window.addEventListener('blur', () => game.cancelCharge());
window.addEventListener('offline', () => { connected = false; $('connection').textContent = 'Offline — reconnecting…'; busy(pending); });
window.addEventListener('online', () => pulse().catch(error));
window.addEventListener('focus', () => pulse().catch(error));
document.addEventListener('visibilitychange', () => { if (!document.hidden) pulse().catch(error); });
setInterval(() => { renderRooms(); renderMatch(); }, 3000);
async function start() {
    try {
        // Session persistence gives separate browser tabs separate player seats and supports reloads.
        await setPersistence(auth, browserSessionPersistence);
        uid = (auth.currentUser || (await signInAnonymously(auth)).user).uid;
        listUnsubscribe = onSnapshot(query(collection(db, 'castleRooms'), where('createdAt', '>', Timestamp.fromMillis(Date.now() - ROOM_MS)), orderBy('createdAt', 'desc')), { includeMetadataChanges: true }, snapshot => {
            connected = !snapshot.metadata.fromCache;
            rooms = snapshot.docs.map(item => ({ id: item.id, ...item.data({ serverTimestamps: 'estimate' }) }));
            if (!roomRef) $('connection').textContent = connected ? 'Online' : 'Reconnecting…';
            busy(pending); renderRooms();
        }, err => { connected = false; error(err); $('connection').textContent = 'Online play unavailable'; });
        const invite = new URL(location.href).searchParams.get('room');
        if (invite) await perform(() => joinRoom(roomCode(invite)));
    } catch (err) { error(err); $('connection').textContent = 'Online play unavailable'; }
}
start();
