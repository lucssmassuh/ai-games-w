const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function shop() {
    const context = vm.createContext({ cc: { Layer: { extend: x => x }, Scene: { extend: x => x }, KEY: { tab: 9, r: 82 } } });
    vm.runInContext(fs.readFileSync(require.resolve('../game.js'), 'utf8'), context);
    return Object.assign(Object.create(context.GameLayer), {
        score: 20, arrowStock: [20, 0, 0], currentArrowType: 0, keys: {},
        arrowTypes: [{ type: 'normal', cost: 1 }, { type: 'explosive', cost: 6 }, { type: 'triple', cost: 3 }],
        scoreLabel: { setString(value) { this.value = value; } },
        shopMessage: { setString(value) { this.value = value; } },
        updateArrowUI() {}, updateArrowStockUI() {}
    });
}
test('purchases debit the right price, add one arrow, select it and update coins', () => {
    const game = shop();
    for (const index of [0, 1, 2]) assert.equal(game.buyArrow(index), true);
    assert.equal(game.score, 10);
    assert.deepEqual(game.arrowStock, [21, 1, 1]);
    assert.equal(game.currentArrowType, 2);
    assert.equal(game.scoreLabel.value, '10');
});
test('insufficient coins, invalid types and game over leave inventory unchanged', () => {
    const game = shop();
    game.score = 5;
    assert.equal(game.buyArrow(1), false);
    assert.match(game.shopMessage.value, /Not enough coins/);
    for (const index of [-1, 3, 0.5]) assert.equal(game.buyArrow(index), false);
    game.isGameOver = true;
    assert.equal(game.buyArrow(0), false);
    assert.equal(game.score, 5);
    assert.deepEqual(game.arrowStock, [20, 0, 0]);
});
test('top row and numpad buy once on release; Tab selects without spending', () => {
    const game = shop();
    game.onKeyPressed(50);
    game.onKeyPressed(50);
    assert.equal(game.score, 20);
    game.onKeyReleased(50);
    game.onKeyReleased(99);
    assert.equal(game.score, 11);
    assert.deepEqual(game.arrowStock, [20, 1, 1]);
    game.onKeyPressed(9);
    assert.equal(game.currentArrowType, 0);
    assert.equal(game.score, 11);
});

test('number keys select every arrow type without coins or changing stock', () => {
    const game = shop();
    game.score = 0;
    game.arrowStock = [4, 2, 1];
    let highlighted;
    game.updateArrowUI = function() { highlighted = this.currentArrowType; };
    for (const [key, index] of [[50, 1], [51, 2], [49, 0], [98, 1], [99, 2], [97, 0]]) {
        game.onKeyReleased(key);
        assert.equal(game.currentArrowType, index);
        assert.equal(highlighted, index);
        assert.equal(game.score, 0);
        assert.deepEqual(game.arrowStock, [4, 2, 1]);
    }
    game.isGameOver = true;
    game.onKeyReleased(50);
    assert.equal(game.currentArrowType, 0);
});
