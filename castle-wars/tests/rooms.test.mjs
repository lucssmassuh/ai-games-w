import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeSeat, occupancy, availableSide, roomCode, playerName, LEASE_MS, ROOM_IDS, reusableRoom, ROOM_MS } from '../rooms.mjs';
const now = 100_000;
const seat = (uid, age = 0) => ({ uid, seen: { toMillis: () => now - age } });
test('empty, waiting, full and disconnected rooms report available seats', () => {
    const room = { left: null, right: null };
    assert.equal(occupancy(room, now), 0);
    room.left = seat('alice');
    assert.equal(occupancy(room, now), 1);
    assert.equal(availableSide(room, 'bob', now), 'right');
    room.right = seat('bob');
    assert.equal(occupancy(room, now), 2);
    assert.equal(availableSide(room, 'eve', now), undefined);
    assert.equal(availableSide(room, 'alice', now), 'left');
    room.left = seat('alice', LEASE_MS);
    assert.equal(activeSeat(room.left, now), false);
    assert.equal(occupancy(room, now), 1);
    assert.equal(availableSide(room, 'eve', now), 'left');
});
test('room codes and invite URLs are validated', () => {
    assert.equal(roomCode(' Room123 '), 'Room123');
    assert.equal(roomCode('https://example.com/castle-wars/index.html?room=Room123'), 'Room123');
    for (const value of ['', '../abc', 'https://example.com/', '<script>']) assert.throws(() => roomCode(value));
});

test('player names trim whitespace and support international names', () => {
    assert.equal(playerName('  Lucas   Massuh  '), 'Lucas Massuh');
    assert.equal(playerName('María 🌟'), 'María 🌟');
    for (const name of ['', '   ', 'a'.repeat(25)]) assert.throws(() => playerName(name));
});

test('ten room slots can only be reused when finished, expired or empty', () => {
    assert.equal(ROOM_IDS.length, 10);
    assert.equal(new Set(ROOM_IDS).size, 10);
    const room = { phase: 'waiting', createdAt: { toMillis: () => now }, left: seat('alice'), right: null };
    assert.equal(reusableRoom(room, now), false);
    assert.equal(reusableRoom(null, now), true);
    assert.equal(reusableRoom({ ...room, phase: 'finished' }, now), true);
    assert.equal(reusableRoom({ ...room, left: null }, now), true);
    assert.equal(reusableRoom(room, now + ROOM_MS), true);
});
