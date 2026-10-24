# Castle Wars multiplayer

Online rooms use Cloud Firestore realtime listeners and anonymous Firebase Authentication in the existing `aigames-f7992` project. Public browser config is in `firebase-config.js`; the unrelated root config is not used.

Players enter a name (1–24 characters) before creating or joining a room. Names are remembered in the browser tab and appear in the lobby, castle labels, scores, and turn status. Invite links ask new players for their name before joining.

There are 10 reusable room slots (room01–room10). Creation claims a slot in a transaction; database rules reject room IDs outside these slots. Finished, expired, or empty rooms can be reused. When all slots are in use, players must join an open room or wait. Deploy the updated Firestore rules together with the client.

Players create a room, copy its invite link, or enter a room code/link. The lobby displays available rooms and live 0/2 or 1/2 occupancy. Seat transactions prevent a third player joining. Heartbeats run every 12 seconds; seats expire after 90 seconds without a heartbeat. Rooms expire after 24 hours and finished matches leave the lobby. Reloading in the same browser tab restores its anonymous identity and match. Explicit Leave releases the seat immediately; closing a tab releases it after the timeout.

The battlefield uses fixed 1440×900 coordinates and 60 physics steps per second. Shots persist their pre-shot state and parameters so either participant can replay and finish after a disconnect. Turn, capacity and membership checks are enforced in Firestore rules. This is a casual game: clients calculate damage; the backend does not validate physics against cheating.

## Backend setup and deployment

The database, anonymous sign-in, and room rules are already configured in `aigames-f7992`. Hosting changes are not published. For a fresh setup:

1. Create a Standard Firestore `(default)` database in project `aigames-f7992` (suggested region `southamerica-east1`).
2. In Firebase Console → Authentication → Get started → Sign-in method, enable **Anonymous**. Use Firebase Authentication; a paid Identity Platform upgrade is unnecessary.
3. Deploy only the dedicated rules: `firebase deploy --only firestore:rules --project aigames-f7992 --config castle-wars/firebase.json` from the repository root. These rules only expose `castleRooms`; other collections stay closed. Review/merge if other Firestore features are added later.
4. Deploy hosting with the existing project's hosting workflow. The root `.firebaserc` default currently refers to a different project, so specify the project explicitly. Do not deploy the root Firestore rules over these rules.

Room URLs use `castle-wars/index.html?room=…` and work with the static hosting setup. Same-device play remains available without signing in.

## Checks

From the repository root:

```sh
node --test castle-wars/tests/game.test.cjs castle-wars/tests/rooms.test.mjs castle-wars/tests/server.test.cjs
firebase emulators:exec --only firestore --project demo-castle-wars --config castle-wars/firebase.json 'node castle-wars/tests/firestore.test.cjs'
```

### Medieval pixel-art presentation

`pixel-renderer.js` runs a Cocos2d-JS 3.13 canvas scene at the simulation's fixed
1440×900 resolution. Castle blocks use the existing pixel tileset; bronze cannon
parts are small code-authored sprite textures. Block visibility and damage tint
follow the simulation state. The generated landscape lives in `assets/`, and
`medieval.css` styles the lobby and controls with a locally bundled Press Start 2P
font (license included). Nearest-neighbor texture filtering keeps sprites crisp.

Physics, shot replay, collision bounds, and multiplayer state remain in `game.js`.
Its transparent offscreen canvas is a live Cocos sprite for HUD and transient
particles, avoiding a second simulation. `local-play.js` makes same-device play
available before Firebase's remote modules finish loading. The online controller
adopts that local mode when it becomes ready.
