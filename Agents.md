# AI Agents in Games

This document provides an overview of the AI agents used across different games in this project.

## Table of Contents
- [Orcs Hunter](#orcs-hunter)
- [Castle Wars](#castle-wars)
- [Princess Paint](#princess-paint)
- [Robo Punch](#robo-punch)
- [Sky Ace](#sky-ace)
- [Wizards School](#wizards-school)
- [Pong](#pong)
- [Handy Blocks](#handy-blocks)

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

## Sky Ace
A vertical scrolling plane shooter game built with TypeScript and Phaser 3.

### Game Files
- `/sky-ace/src/main.ts` - Application entry point and Phaser configuration
- `/sky-ace/src/scenes/PreloadScene.ts` - Asset loading scene
- `/sky-ace/src/scenes/GameScene.ts` - Main gameplay scene
- `/sky-ace/src/objects/Player.ts` - Player plane class
- `/sky-ace/src/objects/Enemy.ts` - Enemy plane class
- `/sky-ace/src/objects/Bullet.ts` - Projectile class

### Technologies
- **TypeScript**: Type-safe game development
- **Phaser 3**: Game framework for rendering and physics
- **Vite**: Build tool and dev server

### Game Mechanics
- Vertical scrolling shooter gameplay
- Player-controlled plane that shoots enemies
- Enemy planes that persist until destroyed
- Bullet collision detection
- Score tracking system

### Development
- Built with modern TypeScript tooling
- Hot module replacement for rapid development
- Optimized production builds

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

## Pong
A classic two-player Pong game with modern visual effects.

### Game Files
- `/pong/game.js` - Complete game logic, physics, and rendering
- `/pong/index.html` - Game entry point with canvas and UI

### Game Mechanics
- **Classic Pong gameplay**: Two paddles, one ball, competitive scoring
- **Physics-based ball movement**: Realistic bouncing with spin effects
- **Paddle collision**: Ball angle changes based on where it hits the paddle
- **Score tracking**: Points awarded when opponent misses the ball
- **Game states**: Waiting, playing, and paused modes

### Controls
- **Player 1 (Left Paddle)**:
  - `W`: Move up
  - `S`: Move down
- **Player 2 (Right Paddle)**:
  - `↑`: Move up
  - `↓`: Move down
- **Spacebar**: Start/pause game

### Visual Features
- Gradient effects on paddles
- Glowing ball with radial gradient
- Dashed center line
- Dark blue background (#0f3460)
- Game state messages (start/pause)

### Game Constants
- Paddle: 10×100 pixels
- Ball: 10 pixel diameter
- Paddle speed: 5 pixels/frame
- Ball speed: 4 pixels/frame

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
