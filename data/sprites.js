// Sprite pixel art definitions. 0 = transparent. Values are 0xRRGGBB integers.
// All sprites have the "forward direction" pointing RIGHT (east = 0 radians in Phaser).

const SPRITE_DEFS = (function () {
    const _ = 0;

    // Player colors
    const PG = 0x00cc66; // green body
    const PD = 0x005533; // dark green shadow
    const PS = 0xffcc88; // skin
    const PM = 0xaaaaaa; // gun metal
    const PK = 0x666666; // gun dark
    const PL = 0x224477; // leg/boot

    // Enemy Drone colors
    const ED = 0x880099; // drone dark edge
    const EP = 0xcc44dd; // drone purple body
    const EC = 0xff99ff; // drone bright core

    // Enemy Tank colors
    const TD = 0x334411; // tank dark
    const TT = 0x667722; // tank olive body
    const TB = 0x99aa44; // tank bright panel
    const TX = 0xff3333; // tank cannon eye

    // Enemy Shooter colors
    const SD = 0x770000; // shooter dark
    const SR = 0xcc2222; // shooter red
    const SY = 0xffaa00; // shooter sensor eye
    const SM = 0x999999; // shooter gun

    // Boss colors
    const BD = 0x440000; // boss very dark
    const BB = 0x990011; // boss body
    const BX = 0xff4444; // boss eyes
    const BO = 0xffbb00; // boss core
    const BM = 0x777777; // boss gun

    // Bullet colors
    const YL = 0xffee11; // player bullet yellow
    const YD = 0xcc9900; // player bullet dark
    const OR = 0xff6600; // enemy bullet orange
    const OD = 0xaa3300; // enemy bullet dark

    // Heart colors
    const HH = 0xff4477; // heart pink-red
    const HD = 0xcc2255; // heart dark

    // Explosion particle
    const XY = 0xffcc00;
    const XO = 0xff6600;
    const XR = 0xff2200;

    return {
        // ── PLAYER ──────────────────────────────────────────────
        // 10 wide × 10 tall, scale 3.  Gun points RIGHT (cols 8-9).
        player: {
            scale: 3,
            frameRate: 8,
            loop: true,
            frames: [
                // Frame 0 – neutral / walk A
                [
                    [_, _, PD, PG, PG, PG, PD, _, _, _],
                    [_, PD, PG, PG, PS, PS, PG, PG, PD, _],
                    [PD, PG, PG, PS, PS, PS, PS, PG, PM, PM],
                    [PD, PG, PS, PS, PS, PS, PS, PG, PK, PK],
                    [PD, PG, PG, PS, PS, PS, PS, PG, PM, PM],
                    [_, PD, PG, PG, PS, PS, PG, PD, _, _],
                    [_, _, PD, PG, PG, PG, PD, _, _, _],
                    [_, _, _, PL, PG, PG, PL, _, _, _],
                    [_, _, _, PL, _, _, PL, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _],
                ],
                // Frame 1 – walk B (legs shifted)
                [
                    [_, _, PD, PG, PG, PG, PD, _, _, _],
                    [_, PD, PG, PG, PS, PS, PG, PG, PD, _],
                    [PD, PG, PG, PS, PS, PS, PS, PG, PM, PM],
                    [PD, PG, PS, PS, PS, PS, PS, PG, PK, PK],
                    [PD, PG, PG, PS, PS, PS, PS, PG, PM, PM],
                    [_, PD, PG, PG, PS, PS, PG, PD, _, _],
                    [_, _, PD, PG, PG, PG, PD, _, _, _],
                    [_, _, PL, PG, PG, PG, PG, PL, _, _],
                    [_, _, PL, _, _, _, _, PL, _, _],
                    [_, _, _, _, _, _, _, _, _, _],
                ],
                // Frame 2 – walk C
                [
                    [_, _, PD, PG, PG, PG, PD, _, _, _],
                    [_, PD, PG, PG, PS, PS, PG, PG, PD, _],
                    [PD, PG, PG, PS, PS, PS, PS, PG, PM, PM],
                    [PD, PG, PS, PS, PS, PS, PS, PG, PK, PK],
                    [PD, PG, PG, PS, PS, PS, PS, PG, PM, PM],
                    [_, PD, PG, PG, PS, PS, PG, PD, _, _],
                    [_, _, PD, PG, PG, PG, PD, _, _, _],
                    [_, _, _, PL, PG, PG, PL, _, _, _],
                    [_, _, _, PL, _, _, PL, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _],
                ],
                // Frame 3 – walk D (legs shifted other way)
                [
                    [_, _, PD, PG, PG, PG, PD, _, _, _],
                    [_, PD, PG, PG, PS, PS, PG, PG, PD, _],
                    [PD, PG, PG, PS, PS, PS, PS, PG, PM, PM],
                    [PD, PG, PS, PS, PS, PS, PS, PG, PK, PK],
                    [PD, PG, PG, PS, PS, PS, PS, PG, PM, PM],
                    [_, PD, PG, PG, PS, PS, PG, PD, _, _],
                    [_, _, PD, PG, PG, PG, PD, _, _, _],
                    [_, PL, PG, PG, PG, PG, PG, PL, _, _],
                    [_, PL, _, _, _, _, _, PL, _, _],
                    [_, _, _, _, _, _, _, _, _, _],
                ],
            ]
        },

        // ── ENEMY DRONE ─────────────────────────────────────────
        // 8×8, scale 3. Pulsing purple orb.
        enemy_drone: {
            scale: 3,
            frameRate: 6,
            loop: true,
            frames: [
                [
                    [_, _, ED, ED, ED, ED, _, _],
                    [_, ED, EP, EP, EP, EP, ED, _],
                    [ED, EP, EP, EC, EC, EP, EP, ED],
                    [ED, EP, EC, EC, EC, EC, EP, ED],
                    [ED, EP, EP, EC, EC, EP, EP, ED],
                    [_, ED, EP, EP, EP, EP, ED, _],
                    [_, _, ED, ED, ED, ED, _, _],
                    [_, _, _, _, _, _, _, _],
                ],
                [
                    [_, _, ED, ED, ED, ED, _, _],
                    [_, ED, EP, EC, EC, EP, ED, _],
                    [ED, EP, EC, EC, EC, EC, EP, ED],
                    [ED, EC, EC, EC, EC, EC, EC, ED],
                    [ED, EP, EC, EC, EC, EC, EP, ED],
                    [_, ED, EP, EC, EC, EP, ED, _],
                    [_, _, ED, ED, ED, ED, _, _],
                    [_, _, _, _, _, _, _, _],
                ],
            ]
        },

        // ── ENEMY TANK ──────────────────────────────────────────
        // 12×10, scale 3. Chunky armored top-down vehicle.
        enemy_tank: {
            scale: 3,
            frameRate: 4,
            loop: true,
            frames: [
                [
                    [TD, TD, TT, TT, TT, TT, TT, TT, TD, TD, _, _],
                    [TD, TT, TT, TB, TB, TB, TB, TT, TT, TD, _, _],
                    [TT, TT, TB, TB, TB, TB, TB, TB, TT, TT, _, _],
                    [TT, TT, TB, TB, TX, TX, TB, TB, TT, TT, _, _],
                    [TT, TT, TB, TB, TX, TX, TB, TB, TT, TT, _, _],
                    [TT, TT, TB, TB, TB, TB, TB, TB, TT, TT, _, _],
                    [TD, TT, TT, TB, TB, TB, TB, TT, TT, TD, _, _],
                    [TD, TD, TT, TT, TT, TT, TT, TT, TD, TD, _, _],
                    [_, _, _, _, _, _, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _, _, _],
                ],
                [
                    [TD, TD, TT, TT, TT, TT, TT, TT, TD, TD, _, _],
                    [TD, TT, TT, TB, TB, TB, TB, TT, TT, TD, _, _],
                    [TT, TT, TB, TB, TB, TB, TB, TB, TT, TT, _, _],
                    [TT, TT, TB, TB, TX, TX, TB, TB, TT, TT, _, _],
                    [TT, TT, TB, TX, TX, TX, TX, TB, TT, TT, _, _],  // eye widens
                    [TT, TT, TB, TB, TB, TB, TB, TB, TT, TT, _, _],
                    [TD, TT, TT, TB, TB, TB, TB, TT, TT, TD, _, _],
                    [TD, TD, TT, TT, TT, TT, TT, TT, TD, TD, _, _],
                    [_, _, _, _, _, _, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _, _, _],
                ],
            ]
        },

        // ── ENEMY SHOOTER ───────────────────────────────────────
        // 10×10, scale 3. Red creature with gun on right.
        enemy_shooter: {
            scale: 3,
            frameRate: 6,
            loop: true,
            frames: [
                [
                    [_, _, SD, SR, SR, SR, SD, _, _, _],
                    [_, SD, SR, SR, SR, SR, SR, SD, _, _],
                    [SD, SR, SR, SY, SY, SR, SR, SR, SM, SM],
                    [SD, SR, SY, SY, SY, SY, SR, SD, SM, _],
                    [SD, SR, SR, SY, SY, SR, SR, SR, SM, SM],
                    [_, SD, SR, SR, SR, SR, SR, SD, _, _],
                    [_, _, SD, SR, SR, SR, SD, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _],
                ],
                [
                    [_, _, SD, SR, SR, SR, SD, _, _, _],
                    [_, SD, SR, SR, SR, SR, SR, SD, _, _],
                    [SD, SR, SR, SY, SY, SY, SR, SR, SM, SM],
                    [SD, SR, SY, SY, SY, SY, SY, SD, SM, _],
                    [SD, SR, SR, SY, SY, SY, SR, SR, SM, SM],
                    [_, SD, SR, SR, SR, SR, SR, SD, _, _],
                    [_, _, SD, SR, SR, SR, SD, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _],
                ],
            ]
        },

        // ── ENEMY BOSS ──────────────────────────────────────────
        // 16×16, scale 3. Large menacing boss with gun pointing right.
        enemy_boss: {
            scale: 3,
            frameRate: 4,
            loop: true,
            frames: [
                [
                    [_, _, _, BD, BB, BB, BB, BB, BB, BB, BB, BD, _, _, _, _],
                    [_, _, BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _, _, _],
                    [_, BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _, _],
                    [BD, BB, BB, BX, BX, BB, BB, BB, BB, BX, BX, BB, BB, BB, BD, _],
                    [BD, BB, BX, BX, BX, BB, BB, BB, BB, BX, BX, BX, BB, BB, BD, BM],
                    [BD, BB, BB, BX, BX, BB, BB, BB, BB, BX, BX, BB, BB, BB, BD, BM],
                    [BD, BB, BB, BB, BB, BB, BO, BO, BO, BB, BB, BB, BB, BB, BD, BM],
                    [BD, BB, BB, BB, BB, BB, BO, BO, BO, BB, BB, BB, BB, BB, BD, _],
                    [BD, BB, BB, BB, BB, BB, BO, BO, BO, BB, BB, BB, BB, BB, BD, _],
                    [BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _],
                    [BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _],
                    [_, BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _, _],
                    [_, _, BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _, _, _],
                    [_, _, _, BD, BB, BB, BB, BB, BB, BB, BB, BD, _, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
                ],
                [
                    [_, _, _, BD, BB, BB, BB, BB, BB, BB, BB, BD, _, _, _, _],
                    [_, _, BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _, _, _],
                    [_, BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _, _],
                    [BD, BB, BB, BX, BX, BB, BB, BB, BB, BX, BX, BB, BB, BB, BD, _],
                    [BD, BB, BX, BX, BX, BX, BB, BB, BX, BX, BX, BX, BB, BB, BD, BM],
                    [BD, BB, BB, BX, BX, BB, BB, BB, BB, BX, BX, BB, BB, BB, BD, BM],
                    [BD, BB, BB, BB, BB, BB, BO, BO, BO, BB, BB, BB, BB, BB, BD, BM],
                    [BD, BB, BB, BB, BB, BO, BO, BO, BO, BO, BB, BB, BB, BB, BD, _],
                    [BD, BB, BB, BB, BB, BB, BO, BO, BO, BB, BB, BB, BB, BB, BD, _],
                    [BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _],
                    [BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _],
                    [_, BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _, _],
                    [_, _, BD, BB, BB, BB, BB, BB, BB, BB, BB, BB, BD, _, _, _],
                    [_, _, _, BD, BB, BB, BB, BB, BB, BB, BB, BD, _, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
                ],
            ]
        },

        // ── PLAYER BULLET ───────────────────────────────────────
        // 5×5, scale 3. Yellow energy bolt pointing RIGHT.
        bullet: {
            scale: 3,
            frames: [
                [
                    [_, YD, YD, YD, _],
                    [YD, YL, YL, YL, YD],
                    [YL, YL, YL, YL, YL],
                    [YD, YL, YL, YL, YD],
                    [_, YD, YD, YD, _],
                ]
            ]
        },

        // ── ENEMY BULLET ────────────────────────────────────────
        // 5×5, scale 3. Orange energy bolt.
        enemy_bullet: {
            scale: 3,
            frames: [
                [
                    [_, OD, OD, OD, _],
                    [OD, OR, OR, OR, OD],
                    [OR, OR, OR, OR, OR],
                    [OD, OR, OR, OR, OD],
                    [_, OD, OD, OD, _],
                ]
            ]
        },

        // ── HEART (HUD health icon) ──────────────────────────────
        // 8×7, scale 3.
        heart: {
            scale: 3,
            frames: [
                [
                    [_, HH, HH, _, _, HH, HH, _],
                    [HH, HH, HH, HH, HH, HH, HH, HH],
                    [HH, HH, HH, HH, HH, HH, HH, HH],
                    [HH, HH, HH, HH, HH, HH, HH, HH],
                    [_, HH, HH, HH, HH, HH, HH, _],
                    [_, _, HH, HH, HH, HH, _, _],
                    [_, _, _, HH, HH, _, _, _],
                ]
            ]
        },

        // ── PARTICLE (death explosion dot) ──────────────────────
        // 4×4, scale 3.
        particle: {
            scale: 3,
            frames: [
                [
                    [_, XY, XY, _],
                    [XY, XO, XO, XY],
                    [XY, XO, XR, XY],
                    [_, XY, XY, _],
                ]
            ]
        },
    };
})();
