# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the game

Serve the directory over HTTP (required — ES modules and canvas textures don't work via `file://`):

```bash
python3 -m http.server 8765
# then open http://localhost:8765
```

No build step, no dependencies to install. Phaser 3.60 loads from jsDelivr CDN.

**After making changes**, reload with the browser cache bypassed: open DevTools → Network tab → tick "Disable cache" → Cmd+R. The version string in `MenuScene.js` (bottom of menu screen, e.g. `v1.2`) confirms which build is loaded.

**Deploying**: `git push origin main` — GitHub Pages auto-deploys from the `main` branch root within ~1 minute. Live at https://autumnpi.github.io/pixel-siege/

## Architecture

**No modules, no bundler.** Every file is a plain `<script>` tag in `index.html`. All classes are globals. Load order in `index.html` is the dependency order — data first, then systems, then entities, then scenes.

### Startup flow

`BootScene` → `MenuScene` → `LevelSelectScene` → `GameScene` (with `HUDScene` launched in parallel) → `LevelCompleteScene` or `GameOverScene`

`BootScene.create()` calls `SpriteFactory.generateAll()` (builds all canvas textures from pixel arrays) and creates the singleton `AudioManager`, stored in `this.registry` so all scenes can access it via `this.registry.get('audio')`.

### Sprite system

Sprites are defined in `data/sprites.js` as named pixel-art 2D arrays (0 = transparent, hex int = colour). `SpriteFactory` rasterises them to `<canvas>` elements and registers them as Phaser textures during boot — no image files exist. Multi-frame entries become spritesheets; Phaser animations are registered at the same time. All sprites face **right** (east = 0 radians) because Phaser's `velocityFromAngle` and rotation use that convention.

### Entity/physics pattern

All game objects extend `Phaser.Physics.Arcade.Sprite` (**not** `Image` — Image has no `preUpdate()` and will freeze the game if used in a physics group with `runChildUpdate: true`). Enemies are pooled via `scene.physics.add.group({ classType, maxSize, runChildUpdate: true })` and reactivated with `.get()` / `enemy.spawn(x, y)`. `BulletPool` and `EnemyBulletPool` follow the same pattern.

### Enemy hierarchy

`EnemyBase` handles: steering toward player, `takeDamage()` with flash + dodge-on-hit, `die()` (deactivate + score + death effect). Subclasses override `_move()` and/or `_act()`:

- **Drone** — zigzag movement (65% forward + 35% perpendicular, alternating)
- **Tank** — no dodge (`_hasDodge = false`), periodic charge attack at speed ×4.5
- **Shooter** — approaches to 200 px then strafes; fires `EnemyBullet` every 1800 ms
- **Boss** — state machine: approach → burst fire → charge → spawn drones; HP bar rendered as GameScene Graphics objects updated each frame

### HUD communication

`HUDScene` runs as a parallel Phaser scene. It communicates **only via events** on the GameScene's event emitter:

```
GameScene.events.emit('scoreChanged', score)
GameScene.events.emit('healthChanged', hp, maxHp)
GameScene.events.emit('waveChanged', wave, total)
GameScene.events.emit('timerTick', timeLeft)        // seconds, float
GameScene.events.emit('timerExpired')
GameScene.events.emit('chargeChanged', meter)        // 0–100
```

HUDScene acquires the emitter via `this.scene.get('Game').events`. Always add matching `events.off` calls in the HUD's `shutdown` handler.

### Charge shot system

`Player._chargeMeter` (0–100) fills when player bullets deal damage: each damage point adds `CONSTANTS.CHARGE_METER_PER_DAMAGE` percent. `CollisionManager` calls `player.addChargeMeter(dmg * CHARGE_METER_PER_DAMAGE)` on every hit. Player fires a charge shot via `player.useChargeMeter(bulletPool)`, triggered by the **Q key** bound in `GameScene.create()`. Damage and bullet scale are linearly interpolated between `CHARGE_DAMAGE_MIN`/`CHARGE_SIZE_MIN` (at 20%) and `CHARGE_DAMAGE_MAX`/`CHARGE_SIZE_MAX` (at 100%). The charged bullet is fired through `BulletPool.fireCharged(x, y, angle, damage, size)`.

### BGM sequencer

`AudioManager.startBGM(levelNum)` selects a pattern (`ch1`/`ch2`/`ch3`/`boss`) and starts a `setInterval` at `pat.stepMs` milliseconds. Each tick advances `_bgmTick` and plays up to four Web Audio oscillator voices:

- **bass** (16-step loop, `square`, short sustain)
- **melody** (64-step loop, `triangle`, sustain = `dur * 6.5` — the long legato pad sound)
- **arp** (16-step loop, `sine`, staccato — fast chord arpeggio texture)
- **counter** (64-step loop, `sine`, medium sustain — parallel 3rds harmony, wave 2+)

Chapter selection: `ch1` = levels 1–2, `ch2` = 4–5, `ch3` = 7–8; boss = levels 3, 6, 9. Call `audio.setWave(n)` to unlock additional voices as waves progress.

### Adding content

**New level**: add an entry to the `LEVELS` array in `data/levels.js`. Fields: `id`, `name`, `floorColor`, `gridColor`, `wallLayout` (key into `WALL_LAYOUTS`), `timeLimit` (seconds), `waves[]`. Each wave has `enemies: [{type, count}]` and `delay` (ms before spawning starts).

**New wall layout**: add a key to `WALL_LAYOUTS` in `data/levels.js`. Rectangles are `{x, y, w, h}` in world pixels. Avoid the centre spawn area (~380–420, ~280–320).

**New enemy type**: extend `EnemyBase`, override `_move()` and `_act()`. Add a group in `GameScene.create()`, register it in `CollisionManager.setup()`, and handle the type string in `WaveManager._spawnEnemy()`.

**New sprite**: add an entry to `SPRITE_DEFS` in `data/sprites.js`. Multi-frame entries need `{ scale, frameRate, loop, frames: [frame1, frame2, ...] }`.

### Persistence

`localStorage` keys: `pixelsiege_hiscore` (integer), `pixelsiege_maxlevel` (integer, 1-indexed — level N unlocked means `maxlevel >= N`).
