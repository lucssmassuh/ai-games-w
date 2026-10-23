const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function game(width, height) {
    let now = 0, frame;
    const listeners = {};
    const gradient = { addColorStop() {} };
    const ctx = new Proxy({}, { get: (_, key) => key.startsWith('create') ? () => gradient : () => {} });
    const canvas = { getContext: () => ctx };
    const document = {
        getElementById: id => id === 'gameCanvas' ? canvas : { play: () => Promise.resolve() },
        addEventListener: (type, handler) => { listeners[type] = handler; }
    };
    const window = { innerWidth: width, innerHeight: height, addEventListener() {} };
    const context = vm.createContext({ window, document, console, Math, Date, performance: { now: () => now },
        requestAnimationFrame: callback => { frame = callback; }, setTimeout() {} });
    vm.runInContext(fs.readFileSync(require.resolve('../game.js'), 'utf8'), context);
    window.castleNetwork = { online: true, canControl: () => false, settled() {} };
    return { api: window.castleGame, canvas, listeners, step() { now += 1000 / 60; frame(); } };
}
test('persisted shots produce identical results across screen sizes and can be resumed', () => {
    const desktop = game(1920, 1080), mobile = game(390, 844);
    assert.equal(desktop.canvas.width, mobile.canvas.width);
    const before = desktop.api.snapshot();
    const shot = { before, player: 'left', angle: -30, power: 120 };
    desktop.api.replay(shot);
    for (let i = 0; i < 40; i++) desktop.step();
    mobile.api.replay(shot); // A reconnect starts from the persisted pre-shot state.
    for (let i = 0; i < 2000; i++) { desktop.step(); mobile.step(); }
    assert.equal(desktop.api.idle, true);
    assert.equal(mobile.api.snapshot(), desktop.api.snapshot());
    const result = JSON.parse(desktop.api.snapshot());
    assert.equal(result.currentPlayer, 'right');
    assert.equal(result.currentRound, 2);
    assert.notEqual(desktop.api.snapshot(), before);
});
test('players outside a live turn cannot charge or fire using keyboard controls', () => {
    const instance = game(1440, 900);
    const before = instance.api.snapshot();
    instance.listeners.keydown({ key: 'q', target: {} });
    instance.listeners.keyup({ key: 'q' });
    assert.equal(instance.api.snapshot(), before);
    assert.equal(instance.api.idle, true);
});
