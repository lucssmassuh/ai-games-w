// Same-device play stays available while the online SDK is loading.
(() => {
    const $ = id => document.getElementById(id);
    $('local').addEventListener('click', () => {
        if (window.castleMultiplayerReady) return;
        window.castleOfflineLocal = true;
        window.castleNetwork = {online: false, canControl: () => true, settled() {}};
        $('lobby').hidden = true;
        $('match-status').textContent = 'Same device · P1: W/S + Q · P2: O/L + P';
        $('connection').textContent = 'Local play';
        $('local').blur();
    });
    for (const button of document.querySelectorAll('#mobile-controls button')) {
        let key, repeat;
        const stop = () => {
            clearInterval(repeat);
            if (key) document.dispatchEvent(new KeyboardEvent('keyup', {key}));
            key = null;
        };
        button.addEventListener('pointerdown', event => {
            if (window.castleMultiplayerReady || !window.castleOfflineLocal) return;
            event.preventDefault(); button.setPointerCapture(event.pointerId);
            const right = JSON.parse(window.castleGame.snapshot()).currentPlayer === 'right';
            key = button.id === 'fire' ? (right ? 'p' : 'q') :
                button.id === 'aim-up' ? (right ? 'o' : 'w') : (right ? 'l' : 's');
            document.dispatchEvent(new KeyboardEvent('keydown', {key}));
            if (button.id !== 'fire') repeat = setInterval(() => document.dispatchEvent(new KeyboardEvent('keydown', {key})), 120);
        });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, stop));
    }
    window.addEventListener('blur', () => window.castleGame.cancelCharge());
})();
