# AI Agents in Games

This document provides an overview of the AI agents used across different games in this project.

## Table of Contents
- [Architecture](#architecture)
- [Orcs Hunter](#orcs-hunter)
- [Castle Wars](#castle-wars)
- [Princess Paint](#princess-paint)
- [Robo Punch](#robo-punch)
- [Wizards School](#wizards-school)
- [Handy Blocks](#handy-blocks)
- [Tokio Invaders](#tokio-invaders)
- [Sticky Bubbles](#sticky-bubbles)
- [Mikael Tax-On](#mikael-tax-on)

## Architecture
@architecture.json

## Orcs Hunter
in the /orcs-hunter folder there are files with javascript code that implement the objects used in the game.
/orcs-hunter/Hero.js contains the code for the main character, who's an elf depcited by the /orcs-hunter/assets/hero.png file. The hero throws arrows at the orcs and dragons. It moves left and right and fires with spacebar.
/orcs-hunter/Dragon.js contains the code for the dragons, who are depicted by the /orcs-hunter/assets/dragon-red.png file.
/orcs-hunter/Orc.js contains the code for the orcs, who are depicted by the /orcs-hunter/assets/orc.png file.
/orcs-hunter/Arrow.js contains the code for the arrows, which are depicted by the /orcs-hunter/assets/arrow.png file. They fly from the hero's arch to the orcs and dragons. The angle of the arrows is calculated to match the arrow trajectory which is given by the strenght of the shoot (how long is the spacebar key hold) and the position of the mouse.
/orcs-hunter/game.js contains the code for the game, which is a tower defense game where the player controls the elf to defend the castle from waves of orcs and dragons. The game uses Cocos 2D V3.13 sdk which is available at /orcs-hunter/cocos2d/cocos2d-js-v3.13.js.
/orcs-hunter/project.json contains the project configuration.
/orcs-hunter/waves.json contains the waves of enemies to be spawned.
/orcs-hunter/Wizzard.js contains the code for the wizard enemy, which is a stronger variant based on BigOrc logic and is depicted by the /orcs-hunter/assets/wizzard.png file.

### Arrow Types and Selection
Controls for arrow modes and purchasing:
- Press **Tab** to cycle through the three arrow modes (highlighted icon shows current mode).
- Press **1**, **2**, **3** to purchase one arrow of type Ordinary/Explosive/Triple for 1/6/3 coins (if you have enough coins). You start with 20 coins.

Icons appear in a 32×32 layout at the bottom-left, with a stock counter below each showing how many arrows you have of that type.

## Castle Wars
A physics-based artillery game where two players control cannons to destroy each other's castles.

### Game Files
- `/castle-wars/game.js` - Main game logic including physics, rendering, and particle effects
- `/castle-wars/index.html` - Game entry point with canvas setup
- `/castle-wars/castle-tileset.png` - Sprite sheet for castle structures
- `/castle-wars/castle-wars.webp` - Game thumbnail

### Game Mechanics
- **Two-player artillery combat**: Players take turns firing cannons at opposing castles
- **Physics-based projectiles**: Cannonballs follow realistic ballistic trajectories with gravity
- **Destructible castles**: Castles are built from blocks that can be destroyed individually
- **Power charging system**: Hold spacebar to charge shot power (visual indicator shows charge level)
- **Angle adjustment**: Use arrow keys to aim the cannon barrel

### Controls
- **Arrow Keys**: Adjust cannon angle up/down
- **Spacebar**: Hold to charge power, release to fire
- **R**: Reset/restart game

### Visual Effects System
The game features a sophisticated particle effects system:

#### Particle Classes
- **`ExplosionParticle`**: Creates debris and fire particles on impact
- **`FallingStone`**: Simulates castle blocks falling with rotation when destroyed
- **`CannonSmokeParticle`**: Generates lingering smoke clouds after firing
- **`TrailParticle`**: Adds smoke trails behind projectiles in flight
- **`SparkParticle`**: Creates sparks that shoot out from cannon fire
- **`MuzzleFlash`**: Enhanced muzzle flash with multi-layer gradients, bright core, and directional blast cone

#### Effect Features
- Realistic smoke that drifts and fades
- Spark particles with gravity and air resistance
- Layered muzzle flash (white core → yellow → orange → red)
- Projectile smoke trails
- Cannon recoil animation
- Proper rendering order (smoke behind, sparks and flashes in front)

## Princess Paint
An interactive SVG-based coloring application where users can paint pre-designed drawings.

### Game Files
- `/princess-paint/app.js` - Main application logic for painting and color selection
- `/princess-paint/index.html` - Application entry point with UI layout
- `/princess-paint/styles.css` - Styling for the painting interface
- `/princess-paint/drawings/` - Collection of SVG drawings to color (29 available)

### Features
- **SVG-based painting**: Click on SVG elements to fill them with selected colors
- **Color palette**: Choose from a variety of colors to paint with
- **Gallery view**: Browse and select from available drawings
- **Screenshot capture**: Download your completed artwork as an image
- **Custom cursor**: Visual feedback showing the current selected color

### Core Functions
- `loadPaintings()`: Loads available SVG drawings from the drawings folder
- `loadGallery()`: Populates the gallery with thumbnail previews
- `loadColors()`: Creates the color palette interface
- `loadPainting(filename)`: Loads a specific SVG drawing into the canvas
- `selectColor(color)`: Changes the active painting color
- `setupEventListeners()`: Handles click events on SVG elements for painting
- `updateFillCursor(x, y)`: Shows a color preview cursor when hovering over paintable areas
- `captureScreenshot()`: Exports the canvas as a PNG image

### User Interaction
- Click on any part of the drawing to fill it with the selected color
- Click color buttons to change the active color
- Click gallery thumbnails to load different drawings
- Click the camera icon to download your artwork

## Robo Punch
A two-player fighting game where robots battle by spinning their feet to hit each other.

### Game Files
- `/robo-punch/game.js` - Main game loop and collision detection
- `/robo-punch/robots.js` - Robot class with movement, shooting, and explosion effects
- `/robo-punch/index.html` - Game entry point with canvas setup

### Game Mechanics
- **Two-player combat**: Red robot (Player 1) vs Blue robot (Player 2)
- **Spinning feet**: Each robot has one static foot and one spinning dynamic foot
- **Collision scoring**: Hit opponent's static foot with your spinning foot to score 10 points
- **Bullet system**: Fire bullets to hit opponent's static foot for 20 points and reverse their spin
- **Explosion effects**: Visual particle effects when bullets hit

### Controls
- **Player 1 (Red)**:
  - `Q`: Toggle feet (switch which foot is spinning)
  - `W`: Fire bullet
- **Player 2 (Blue)**:
  - `P`: Toggle feet
  - `O`: Fire bullet

### Robot Class Features
- Dynamic foot rotation with configurable spin speed
- Bullet firing system with velocity and lifetime management
- Particle explosion effects on hit
- Score tracking for each player
- Canvas boundary constraints

### Collision Detection
- `checkCollisionAndToggleDirection()`: Detects foot-to-foot collisions
- `checkBulletCollision()`: Detects bullet-to-foot hits and triggers spin reversal

## Wizards School
A gesture-based magic wand application using hand tracking and machine learning.

### Game Files
- `/wizards-school/index.html` - Main application with embedded JavaScript
- `/wizards-school/index.js` - Gesture detection and spell casting logic
- `/wizards-school/fingerpose_combinations.js` - Custom gesture definitions
- `/wizards-school/spells.json` - Spell configurations and effects
- `/wizards-school/agents.md` - Detailed technical documentation

### Technologies
- **TensorFlow.js**: Machine learning framework for hand tracking
- **HandPose model**: Real-time hand landmark detection
- **Fingerpose library**: Gesture recognition and classification

### Features
- **Real-time hand tracking**: Detects hand position and landmarks via webcam
- **Gesture recognition**: Identifies specific hand gestures (thumbs up, victory, thumbs down, etc.)
- **Spell casting**: Maps gestures to magical spells with visual effects
- **Confidence scoring**: Shows probability scores for detected gestures
- **Visual feedback**: Displays hand landmarks and gesture results

### Core Components
1. **Gesture Detection Agent**: Processes video frames to detect and classify hand gestures
2. **UI Manager**: Handles visualization of video feed, landmarks, and detection results
3. **Spell System**: Maps gestures to spell effects defined in spells.json
4. **Gesture Library**: Defines custom gesture configurations in fingerpose_combinations.js

### User Experience
1. Grant camera permissions
2. Perform hand gestures in view of webcam
3. See real-time detection results and confidence scores
4. Cast spells by making specific gestures

## Handy Blocks
An Arkanoid/Breakout game controlled by hand tracking via webcam. Move your hand left and right to steer the magic paddle and break enchanted bricks.

### Game Files
- `/handy-blocks/game.js` - Game logic, physics, hand tracking integration, and rendering
- `/handy-blocks/index.html` - Game entry point with canvas and loading screen

### Hand Tracking
Uses the same TensorFlow.js handpose architecture as Wizards School:
- Libraries: `@tensorflow-models/handpose@0.0.7`, `@tensorflow/tfjs-core@3.7.0`
- Palm center is computed as the average X of landmarks [0, 5, 9, 13, 17] for stable tracking
- Raw landmark X is mirrored (`1 - rawX / videoWidth`) to match the flipped webcam display
- Webcam feed is drawn semi-transparently (35% opacity) as game background

### Game Mechanics
- **Brick grid**: 8 columns × 5 rows (40 bricks), colour-coded by row
- **Paddle collision**: bounce angle varies based on where the ball hits (up to ±67.5°)
- **Lives**: 3 lives; losing the ball costs one life
- **Score**: +10 per brick destroyed
- **Win condition**: all bricks cleared

### Controls
- **Hand (primary)**: palm X position controls paddle
- **Mouse**: cursor position as fallback
- **Touch**: drag finger across screen
- **Arrow keys**: left/right to nudge paddle
- **Space / Enter / Click / Tap**: start or restart game

### Visual Features
- Purple glowing paddle with gradient
- Orange fireball with radial gradient and sparkle trail
- Per-row brick hues: purple → blue → teal → yellow → red-orange
- Particle burst on every brick hit and ball loss
- Dark magical overlay on top of webcam background

## Tokio Invaders
A neon-lit arcade shooter where the player defends Tokio from waves of aliens. Built on Cocos2d (vendored at `/space-invaders/vendor/cocos2d`).

### Game Files
- `/space-invaders/index.html` - Game entry point and HUD markup
- `/space-invaders/main.js` - Boot: loads the campaign, level and sprite JSON, then starts the Cocos2d scene
- `/space-invaders/project.json` - Cocos2d project configuration
- `/space-invaders/src/model.js` - Game model: level validation (`Neon.validateLevel`), player, aliens, bullets, power-ups, lives and scoring
- `/space-invaders/src/cocos-game.js` - Cocos2d scene that renders the model and spawns effects
- `/space-invaders/src/ui.js` - DOM overlays (briefings, HUD, toasts), keyboard input and sound
- `/space-invaders/levels/campaign.json` - Ordered list of level files
- `/space-invaders/levels/*.json` - Five districts: Shinjuku, Shibuya, Akihabara, Ginza and Tokio Core (formation, movement, enemy fire, scores, power-up settings)
- `/space-invaders/assets/sprites/sprites.json` - Sprite sheet metadata for the player, aliens (squid, crab, insect) and power-ups

### Game Mechanics
- 3 lives (shields); getting hit grants brief invulnerability and clears active power-ups
- Alien types score differently per level; clearing a level gives a clear bonus
- Power-ups drop from aliens: rapid fire, double shot and piercing shot (timed)

### Controls
- `Arrow Left/Right` or `A/D`: Move
- `Space`: Fire
- `Enter`: Start / skip the briefing
- `Esc`: Pause
- `M`: Toggle sound
- `R`: Restart after game over or victory

## Sticky Bubbles
A bubble shooter aimed with hand tracking. Match three or more bubbles of the same colour on a hex grid to pop them.

### Game Files
- `/sticky-bubbles/game.js` - All game logic: hex grid, shooting, matching, hand tracking and rendering
- `/sticky-bubbles/index.html` - Game entry point with canvas and loading screen

### Hand Tracking
Uses the same TensorFlow.js handpose architecture as Wizards School and Handy Blocks (`@tensorflow-models/handpose@0.0.7`, `@tensorflow/tfjs-core@3.7.0`). The hand's horizontal position aims the shooter.

### Game Mechanics
- 800×600 canvas, hex grid of 13/12 bubbles per row, 6 colours
- Bubbles must attach to the top or to an existing bubble; groups of matching colours are popped
- Game over when a bubble reaches row 10; win when the grid is empty

### Controls
- **Hand (primary)**: horizontal position aims the shooter
- **Mouse / touch**: move to aim; click or tap to shoot
- **Space / Enter**: shoot, or start/restart the game

## Mikael Tax-On
A side-scrolling endless-runner-style game, ported from the original Android game: dash through the months of the year collecting pesos while Argentine payroll taxes eat into the paycheck. It is dependency-free vanilla JS with Canvas2D and ES modules (no build step, and it does not use Cocos2d; see `PORTING_NOTES.md`).

### Game Files
- `/michaeltaxon/index.html`, `/michaeltaxon/style.css` - Canvas shell
- `/michaeltaxon/src/main.js` - Boot and game loop
- `/michaeltaxon/src/engine/` - Tiny canvas engine: assets, sprite sheets, camera, input
- `/michaeltaxon/src/physics.js` - Simplified arcade gravity and platform physics
- `/michaeltaxon/src/tax.js` - Payroll tax calculation (SIPA, Obra Social, PAMI, Ganancias)
- `/michaeltaxon/src/level.js` - Loader for the original XML level format (`assets/level/level2.xml`)
- `/michaeltaxon/src/entities/` - Player, Boss, Bomb, Coin
- `/michaeltaxon/src/scenes/` - Splash, Welcome, Menu and Game scenes
- `/michaeltaxon/README.md`, `/michaeltaxon/PORTING_NOTES.md` - Run instructions and what was ported vs adapted

### Controls
- Tap / click, `Space`, `Arrow Up` or `Enter`: Jump over gaps
- During the Aguinaldo and Fin de Año sections, the same input turns the player around to dodge bombs and catch falling bills

### Game Mechanics
- Level flow: run and jump over gaps, then the Aguinaldo (mid-year bonus) event, then the Fin de Año (year-end) event, then the end-of-year star and salary summary
- Rewards and penalties: +8000 per bill caught, -1500 per bomb hit
- Final screen breaks the gross pay down by taxes into a final score
- Serve over HTTP (e.g. `python3 -m http.server`); `fetch()` of level files fails from `file://`
