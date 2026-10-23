export const LEASE_MS = 90_000;
export const ROOM_MS = 24 * 60 * 60 * 1000;
export function activeSeat(seat, now = Date.now()) {
    return !!seat && seat.seen?.toMillis() > now - LEASE_MS;
}
export function occupancy(room, now = Date.now()) {
    return ['left', 'right'].filter(side => activeSeat(room[side], now)).length;
}
export function availableSide(room, uid, now = Date.now()) {
    return ['left', 'right'].find(side => room[side]?.uid === uid) ||
        ['left', 'right'].find(side => !activeSeat(room[side], now));
}
export function roomCode(value) {
    const text = value.trim();
    let code = text;
    if (/^https?:\/\//.test(text)) code = new URL(text).searchParams.get('room') || '';
    if (!/^[A-Za-z0-9_-]{6,40}$/.test(code)) throw new Error('Enter a valid room code or invite link.');
    return code;
}

export function playerName(value) {
    const name = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ');
    if (!name || name.length > 24) throw new Error('Enter your name (1–24 characters).');
    return name;
}
