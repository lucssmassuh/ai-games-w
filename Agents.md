# AI Agents in Games

This document provides an overview of the AI agents used across different games in this project.

## Table of Contents
- [Orcs Hunter](#orcs-hunter)
- [Castle Wars](#castle-wars)
- [Princess Paint](#princess-paint)
- [Robo Punch](#robo-punch)

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
*Agents used in the Princess Paint game*

## Robo Punch
*Agents used in the Robo Punch game*
/orcs-hunter/waves.json

## Castle Wars
*Agents used in the Castle Wars game*

## Princess Paint
*Agents used in the Princess Paint game*

## Robo Punch
*Agents used in the Robo Punch game*

