const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
test('development server serves invite links, directories and browser modules', async t => {
    const server = spawn(process.execPath, ['index.js'], {
        cwd: path.resolve(__dirname, '../..'), env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    t.after(() => server.kill());
    const port = await new Promise((resolve, reject) => {
        server.stdout.once('data', data => resolve(String(data).match(/localhost:(\d+)/)[1]));
        server.once('error', reject);
        server.stderr.once('data', data => reject(new Error(String(data))));
    });
    const base = `http://127.0.0.1:${port}`;
    for (const route of ['/castle-wars/index.html?room=Room123', '/castle-wars/']) {
        const result = await fetch(base + route);
        assert.equal(result.status, 200);
        assert.match(await result.text(), /id="lobby"/);
    }
    const module = await fetch(base + '/castle-wars/rooms.mjs');
    assert.equal(module.status, 200);
    assert.match(module.headers.get('content-type'), /javascript/);
});
