# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**This file is the source of truth for project state.** Current Status must never become stale. The Development Journal is append-only — entries are never edited or deleted.

---

## 0. Session Workflow (IMPORTANT)

This section defines a mandatory process that Claude MUST follow at the end of every coding session without exception. It is part of the project design, not a suggestion.

### End-of-session checklist

At the end of every session, Claude MUST:

1. **Summarise** what was done during the session (features added, bugs fixed, decisions made)
2. **Update Section 2 — Current Status** so it reflects the exact state of the project right now:
   - Move newly completed features into the completed list
   - Update "Current focus" to reflect what was just worked on or what comes next
   - Clear resolved bugs from "Known bugs / issues"
   - Update "Immediate next tasks" based on what was discussed
3. **Append a new Development Journal entry** to the bottom of Section 3 (oldest → newest ordering) using the format below
4. **Suggest a conventional commit message** in `feat/fix/refactor/docs` style covering the code changes and the CLAUDE.md update
5. **Confirm whether to push to GitHub** and remind the user to do so if the session produced changes worth keeping

### Journal entry format

```
### YYYY-MM-DD — Session N (vX.Y if applicable)

#### Added
- (new features, files, systems)

#### Fixed
- (bugs resolved — include root cause if non-obvious)

#### Changed / Decisions
- (design decisions, architecture choices, constants changed, things renamed or removed)

#### Next Session
- (concrete planned next steps)

#### Notes
- (anything a future Claude instance needs to know that isn't obvious from the code)
```

### Enforcement rules

- **Current Status MUST NOT become stale.** If it describes a state that no longer exists, it is wrong and misleads future sessions.
- **Development Journal is append-only.** Never edit, delete, or reorder past entries. Only add new entries at the bottom.
- **CLAUDE.md is the source of truth.** If CLAUDE.md contradicts the code, the code is correct and CLAUDE.md must be updated to match. Never let them drift.

---

## 1. Project Reference

### How to run locally

```bash
python3 -m http.server 8765
# open http://localhost:8765
```

No build step, no dependencies to install. Phaser 3.60 loads from jsDelivr CDN. The game cannot be opened directly via `file://` — a local server is required (canvas textures and module scoping).

**Confirming a code change loaded**: the version string at the bottom of the menu screen (e.g. `v1.2`) is the quickest check. If it shows an old version after a push, bypass the cache: open DevTools → Network tab → tick "Disable cache" → Cmd+R (Mac) / Ctrl+R (Windows). Or hard-refresh with Cmd+Shift+R / Ctrl+Shift+R.

### Deployment

`git push origin main` — GitHub Pages auto-deploys from the `main` branch root within ~1 minute.
Live URL: **https://autumnpi.github.io/pixel-siege/**

---

### Architecture overview

**No bundler, no modules.** Every file is a plain `<script>` tag in `index.html`. All classes are globals. Load order in `index.html` is the dependency order — data first, then systems, then entities, then scenes. When adding a new file, insert its `<script>` tag in the correct position.

### Scene flow

```
BootScene → MenuScene → LevelSelectScene → GameScene + HUDScene (parallel)
                                                ↓                ↓
                                        LevelCompleteScene   GameOverScene
                                                ↓
                                        GameScene (next level)
```

`BootScene.create()` runs `SpriteFactory.generateAll()` (builds all canvas textures) and creates the `AudioManager` singleton, stored in `this.registry` so every scene can access it via `this.registry.get('audio')`. BootScene does not load any external assets.

### Sprite system

Sprites are defined in `data/sprites.js` as named pixel-art 2D arrays (`0` = transparent, hex int = colour). `SpriteFactory` rasterises them to `<canvas>` elements and registers them as Phaser textures during boot — **no image files exist**. Multi-frame entries (`frames: [frame1, frame2, ...]`) are turned into spritesheets and Phaser animations are registered at the same time.

All sprites face **right** (east = 0 radians), matching Phaser's `velocityFromAngle` and physics rotation convention.

To add a new sprite, add an entry to `SPRITE_DEFS` in `data/sprites.js`. Single frame: `{ scale, frames: [pixels2DArray] }`. Multi-frame: `{ scale, frameRate, loop, frames: [...] }`.

### Entity and physics pooling

All game objects extend **`Phaser.Physics.Arcade.Sprite`** — never `Phaser.Physics.Arcade.Image`. `Image` has no `preUpdate()` method; using it as a pool class with `runChildUpdate: true` causes a `TypeError` every frame that freezes the Phaser update loop while Web Audio's `setInterval` keeps playing. This was the root cause of the v1.0 shoot-freeze bug.

Enemies and bullets are pooled via:
```js
scene.physics.add.group({ classType, maxSize, runChildUpdate: true, defaultKey })
```
Objects are reactivated with `.get()` and a custom `spawn(x, y)` / `fire(x, y, angle)` call. On deactivation call `setActive(false).setVisible(false)` and `body.stop()`.

### Enemy hierarchy

`EnemyBase` handles: steering toward player, flash + dodge-on-hit in `takeDamage()`, and `die()` (deactivate, play sound, spawn particles, call `scene.onEnemyKilled()`). Subclasses override `_move()` and/or `_act()`:

| Class | Key behaviour |
|---|---|
| `EnemyDrone` | Zigzag (65% forward + 35% perpendicular, alternating every ~1 s); HP 10 |
| `EnemyTank` | No dodge (`_hasDodge = false`); periodic charge at 4.5× speed; HP 45 |
| `EnemyShooter` | Approaches to 200 px then strafes; fires every 1800 ms; HP 20 |
| `EnemyBoss` | State machine: approach → burst fire → charge → spawn drones; HP 400+ (scales with level); owns its own health bar Graphics objects |

`EnemyBase.preUpdate()` calls `super.preUpdate()` **after** the `if (!this.active) return` guard, which is required for correct Phaser pooling lifecycle.

### HUD communication

`HUDScene` runs as a **parallel** Phaser scene — it never renders world objects. It communicates only via events on GameScene's event emitter:

| Event | Payload |
|---|---|
| `scoreChanged` | `score` (int) |
| `healthChanged` | `hp, maxHp` |
| `waveChanged` | `wave, total` |
| `timerTick` | `timeLeft` (float, seconds) |
| `timerExpired` | — |
| `chargeChanged` | `meter` (0–100) |

HUDScene acquires the emitter via `this.scene.get('Game').events`. Always register a matching `events.off` for every `events.on` inside the HUD's `shutdown` handler to prevent ghost listeners.

### Charge shot system

`Player._chargeMeter` (0–100) fills when player bullets deal damage. Each damage point adds `CONSTANTS.CHARGE_METER_PER_DAMAGE` percent. `CollisionManager` calls `player.addChargeMeter(dmg * CHARGE_METER_PER_DAMAGE)` after every hit. Firing is triggered by the **Q key**, bound in `GameScene.create()`:

```js
this.qKey.on('down', () => player.useChargeMeter(bulletPool));
```

Damage and bullet scale are linearly interpolated between `CHARGE_DAMAGE_MIN`/`CHARGE_SIZE_MIN` (at 20%) and `CHARGE_DAMAGE_MAX`/`CHARGE_SIZE_MAX` (at 100%). The charged bullet is fired through `BulletPool.fireCharged(x, y, angle, damage, size)`. A glow ring is drawn around the player in `GameScene.update()` directly from `player._chargeMeter` — no event listener needed there.

### Audio system

`AudioManager.startBGM(levelNum)` selects a pattern (`ch1`/`ch2`/`ch3`/`boss`) and runs a `setInterval` at `pat.stepMs` ms. Each tick plays up to four Web Audio oscillator voices:

| Voice | Oscillator | Sustain | Purpose |
|---|---|---|---|
| bass | `square` | `dur × 0.7` | Rhythmic foundation, 16-step loop |
| melody | `triangle` | `dur × 6.5` | Long legato pad — the main 80s synth sound |
| arp | `sine` | `dur × 0.4` | Fast staccato chord arpeggios, 16-step loop |
| counter | `sine` | `dur × 5.5` | Parallel-thirds harmony, 64-step loop, wave 2+ |

Chapter selection: ch1 = levels 1–2, ch2 = 4–5, ch3 = 7–8; boss = levels 3, 6, 9. All patterns use **major or modal** scales (D Major, A Dorian, B Major, C Harmonic Minor) — avoid natural minor/Aeolian to keep the 80s sci-fi feel. Call `audio.setWave(n)` to layer additional voices as waves progress.

### Level and wall data

`data/levels.js` defines:
- `WALL_LAYOUTS`: named sets of `{x, y, w, h}` rectangles in world pixels. Avoid the centre spawn zone (~380–420, ~280–320).
- `LEVELS[0..8]`: each entry has `id`, `name`, `floorColor`, `gridColor`, `wallLayout` (key into `WALL_LAYOUTS`), `timeLimit` (seconds), `waves[]`.
- Each wave: `{ enemies: [{type, count}], delay }` — type strings are `'drone'`, `'tank'`, `'shooter'`, `'boss'`.

### Persistence

`localStorage` keys: `pixelsiege_hiscore` (int), `pixelsiege_maxlevel` (int, 1-indexed — value N means sector N is unlocked and N+1 is next to unlock).

### Adding content checklist

**New level** → add entry to `LEVELS` in `data/levels.js`.
**New wall layout** → add key to `WALL_LAYOUTS` in `data/levels.js`.
**New enemy type** → extend `EnemyBase`; add a group in `GameScene.create()`; register in `CollisionManager.setup()`; handle type string in `WaveManager._spawnEnemy()`.
**New sprite** → add entry to `SPRITE_DEFS` in `data/sprites.js`.
**New sound** → add a method to the `_sounds` object in `AudioManager`, call with `audio.play('key')`.

---

## 2. Current Status

*This section must be kept up to date at the end of every session. If it is inaccurate, fix it.*

### Completed features (v1.2)

- Full 9-level game with wave-based enemy spawning
- 4 enemy types: Drone (zigzag), Tank (charge), Shooter (strafing + fires back), Boss (3-phase)
- WASD movement + mouse aim + auto-fire on hold-click
- **Charge shot** — damage meter fills as player deals damage; press **Q** to fire; damage/size scale 3×–15× based on fill level
- Level selection screen (3×3 grid, locked/unlocked, localStorage persistence)
- Level countdown timer (100 s → 70 s); flashes red under 30 s; expires → grace period → game over
- Wall/obstacle system (6 layouts: open, pillars, corridors, cross, scattered, boss_room)
- **80s sci-fi BGM** — D Major / A Dorian / B Major / C Harmonic Minor patterns; sustained triangle pad melody; fast sine arpeggio texture; parallel-thirds counter-melody on wave 2+
- High score persistence (localStorage)
- HUD: health hearts, score, wave counter, timer, charge meter
- Menu, Level Select, Level Complete, Game Over screens
- GitHub Pages deployment (https://autumnpi.github.io/pixel-siege/)

### Current focus

Nothing active — v1.2 shipped and stable.

### Known bugs / issues

None currently reported.

### Immediate next tasks

Not yet decided. Candidates discussed:
- Procedural level generation beyond level 9 (scaling exists in WaveManager but not tested)
- More enemy variety / boss patterns
- Difficulty settings
- Sound effects for charge meter filling / threshold crossed

---

## 3. Development Journal

Entries are ordered **oldest at the top, newest at the bottom**. Never edit or delete past entries — only append new ones at the bottom.

---

### 2026-06-06 — Session 1 (v1.0 → v1.01)

#### Added
- **Initial full game build** (`5b2e58d`): complete Phaser 3 top-down shooter — player, 4 enemy types, 9 levels, wave system, HUD, menu, level complete, game over, high score, procedural sprites via canvas, Web Audio chiptune BGM + SFX, screen shake, death particles, scorch marks, GitHub + Pages setup

#### Fixed
- **Game freeze on shoot** (`b53e721`): root cause — `Bullet` and `EnemyBullet` extended `Phaser.Physics.Arcade.Image`, which has no `preUpdate()` method. `super.preUpdate()` threw `TypeError: (intermediate value).preUpdate is not a function` every frame once any bullet was alive, halting the entire Phaser update loop while Web Audio's `setInterval` kept running. Fix: change both classes to extend `Phaser.Physics.Arcade.Sprite`.
  - A prior attempt (`64812ce`) added null guards on `this.body` and try-catch — this reduced some errors but did not fix the freeze because the root cause was the wrong base class.

#### Changed / Decisions
- Chose Phaser 3 via CDN (no build step) to keep the project simple and instantly shareable
- All sprites generated procedurally at runtime from pixel arrays — no asset pipeline needed
- `AudioManager` stored in Phaser registry so all scenes share one Web Audio context
- GitHub Pages chosen for hosting (free, zero-config for static sites)

#### Next Session
- Level select screen
- More interesting enemies
- Walls / obstacles

#### Notes
- **Critical**: always extend `Phaser.Physics.Arcade.Sprite`, never `Image`, for any object used in a physics group with `runChildUpdate: true`
- Browser cache is the #1 source of confusion when testing — always verify version string or disable cache in DevTools

---

### 2026-06-06 — Session 2 (v1.1)

#### Added
- **Level selection screen** (`LevelSelectScene`): 3×3 grid, locked/unlocked via `pixelsiege_maxlevel` in localStorage; boss levels red, latest unlock green
- **Charge shot** (hold-click mechanic, later replaced in v1.2): hold ≥ 700 ms → charge ring grows; release → fire 5× damage / 3× size cyan bullet
- **Level countdown timer**: per-level `timeLimit` (100 s → 70 s); HUD countdown; red flash + alarm on expiry; 2.5 s grace period before game over
- **Wall/obstacle system**: static physics groups; 6 named layouts in `WALL_LAYOUTS`; all enemies and player collide
- **Enemy rebalancing**: Drone HP 10 + zigzag; Tank HP 45 + charge attack + no dodge; Shooter HP 20 + improved cooldown (1800 ms); all enemies dodge sideways on hit
- **BGM** (replaced in v1.2): 3 chapter patterns (A minor, D minor, E minor) + boss; counter-melody from wave 2, percussion from wave 3
- GameOver: Retry / Levels / Menu buttons (retry restarts same level)
- `LevelCompleteScene`: TAB → level select shortcut

#### Fixed
- Nothing (v1.1 was a clean feature batch on top of v1.01)

#### Changed / Decisions
- Score carries over across levels (passed via scene `data` object)
- `EnemyBase.preUpdate()` now calls `super.preUpdate()` after the active guard — required for correct pooling
- `CollisionManager` uses `bullet.damage` property (set per-bullet) rather than a global constant

#### Next Session
- Playtest enemy balance — Tank may be too tanky with HP 45
- Improve BGM to be more melodic and less minor-scale (led to v1.2)

#### Notes
- Wall layouts: never place a rectangle over the player spawn point (400, 300)
- Boss HP scales with level: `Math.floor(400 * (1 + Math.max(0, levelNumber - 3) * 0.2))`

---

### 2026-06-06 — Session 3 (v1.2)

#### Added
- **BGM overhaul**: four-voice 80s sci-fi synth system (bass/melody/arp/counter); sustained triangle pad melody (`dur × 6.5` sustain = legato); 8-second melody loop (was 4 s); D Major ch1, A Dorian ch2, B Major ch3, C Harmonic Minor boss
- **Charge shot redesign**: damage-meter system replacing hold-click mechanic; `Player._chargeMeter` (0–100) fills at `CHARGE_METER_PER_DAMAGE` % per damage point; press **Q** to fire at any level ≥ 20%; bullet damage linearly scales 3–15×, size scales 1.5–4× with meter; glow ring around player changes colour (green → orange → cyan)
- HUD charge bar always visible (was hidden when empty); shows DEAL DAMAGE / [Q] FIRE READY / * MAX POWER * states; colour codes fill: dim → green → yellow → orange → cyan

#### Fixed
- Nothing (clean state after v1.1)

#### Changed / Decisions
- Removed CHARGE_MIN_HOLD, CHARGE_MAX_HOLD, CHARGE_COOLDOWN constants entirely
- Left-click now only auto-fires normal bullets — no hold mechanic
- Charge shot tint reflects power level: green (weak) → yellow → cyan (full)
- `CollisionManager` is now the single place charge meter fill is triggered (after enemy takes damage)
- Menu hint line updated to explain the new mechanic

#### Next Session
- Playtest and balance CHARGE_METER_PER_DAMAGE (currently 2% per damage point)
- Consider additional visual feedback when meter crosses 20% threshold (brief screen pulse?)

#### Notes
- `addChargeMeter()` uses `Math.floor` comparison to avoid emitting `chargeChanged` on every sub-percent tick — important for performance with fast auto-fire

---

### 2026-06-06 — Session 4

#### Added
- `CLAUDE.md` — initial technical reference document (Project Reference, Current Status, Development Journal)

#### Fixed
- Nothing

#### Changed / Decisions
- CLAUDE.md structure decided: three sections — stable reference, living status, append-only journal
- Agreed this file acts as both technical manual and project memory across sessions

#### Next Session
- Update Current Status and append a journal entry at the end of every session
- Decide on next feature from the candidate list in Current Status

#### Notes
- Version string in MenuScene (`v1.x`) is the fastest way to confirm a new build loaded in browser
- GitHub Pages takes ~1 minute to deploy after push; browser cache bypass: Cmd+Shift+R or DevTools Network → Disable cache

---

### 2026-06-06 — Session 5

#### Added
- Section 0 — Session Workflow (IMPORTANT): mandatory end-of-session checklist, journal entry format, enforcement rules

#### Fixed
- Nothing

#### Changed / Decisions
- Development Journal ordering standardised to oldest → newest (was newest → oldest in previous version)
- Added explicit enforcement rules: Current Status must not become stale; journal is append-only; CLAUDE.md is source of truth
- Section 0 placed before all other sections to ensure it is seen first

#### Next Session
- Follow the Section 0 workflow at the end of every session going forward

#### Notes
- If CLAUDE.md contradicts the code, the code is correct — update CLAUDE.md to match, not the other way around
