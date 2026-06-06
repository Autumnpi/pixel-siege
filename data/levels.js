const WALL_LAYOUTS = {
    open: [],

    pillars: [
        { x: 170, y: 120, w: 30, h: 80 },
        { x: 600, y: 120, w: 30, h: 80 },
        { x: 170, y: 400, w: 30, h: 80 },
        { x: 600, y: 400, w: 30, h: 80 },
        { x: 375, y: 110, w: 50, h: 20 },
        { x: 375, y: 470, w: 50, h: 20 },
    ],

    corridors: [
        { x: 140, y: 0,   w: 25, h: 210 },
        { x: 140, y: 390, w: 25, h: 210 },
        { x: 635, y: 0,   w: 25, h: 210 },
        { x: 635, y: 390, w: 25, h: 210 },
        { x: 250, y: 140, w: 300, h: 20 },
        { x: 250, y: 440, w: 300, h: 20 },
    ],

    cross: [
        { x: 390, y: 0,   w: 20, h: 190 },
        { x: 390, y: 410, w: 20, h: 190 },
        { x: 0,   y: 290, w: 290, h: 20 },
        { x: 510, y: 290, w: 290, h: 20 },
    ],

    scattered: [
        { x: 100, y: 100, w: 80, h: 20 },
        { x: 580, y: 180, w: 20, h: 90 },
        { x: 280, y: 60,  w: 20, h: 90 },
        { x: 460, y: 420, w: 90, h: 20 },
        { x: 130, y: 360, w: 20, h: 100 },
        { x: 610, y: 440, w: 100, h: 20 },
        { x: 310, y: 280, w: 70, h: 20 },
    ],

    boss_room: [
        { x: 55,  y: 55,  w: 110, h: 110 },
        { x: 635, y: 55,  w: 110, h: 110 },
        { x: 55,  y: 435, w: 110, h: 110 },
        { x: 635, y: 435, w: 110, h: 110 },
    ],
};

const LEVELS = [
    {
        id: 1, name: 'SECTOR ALPHA',
        floorColor: 0x080818, gridColor: 0x12122a,
        wallLayout: 'open', timeLimit: 100,
        waves: [
            { enemies: [{ type: 'drone', count: 4 }], delay: 0 },
            { enemies: [{ type: 'drone', count: 6 }], delay: 1500 },
            { enemies: [{ type: 'drone', count: 5 }, { type: 'tank', count: 1 }], delay: 2000 },
        ]
    },
    {
        id: 2, name: 'SECTOR BETA',
        floorColor: 0x081008, gridColor: 0x121a12,
        wallLayout: 'pillars', timeLimit: 90,
        waves: [
            { enemies: [{ type: 'drone', count: 5 }, { type: 'shooter', count: 1 }], delay: 0 },
            { enemies: [{ type: 'drone', count: 4 }, { type: 'tank', count: 2 }], delay: 2000 },
            { enemies: [{ type: 'shooter', count: 3 }, { type: 'drone', count: 4 }], delay: 2000 },
        ]
    },
    {
        id: 3, name: 'BOSS: SECTOR GAMMA',
        floorColor: 0x120808, gridColor: 0x1e0808,
        wallLayout: 'open', timeLimit: 120,
        waves: [
            { enemies: [{ type: 'drone', count: 6 }, { type: 'shooter', count: 2 }], delay: 0 },
            { enemies: [{ type: 'boss', count: 1 }], delay: 3000 },
        ]
    },
    {
        id: 4, name: 'SECTOR DELTA',
        floorColor: 0x080818, gridColor: 0x12122a,
        wallLayout: 'corridors', timeLimit: 85,
        waves: [
            { enemies: [{ type: 'drone', count: 7 }, { type: 'tank', count: 2 }], delay: 0 },
            { enemies: [{ type: 'shooter', count: 4 }, { type: 'drone', count: 5 }], delay: 2000 },
            { enemies: [{ type: 'tank', count: 3 }, { type: 'shooter', count: 3 }], delay: 2000 },
        ]
    },
    {
        id: 5, name: 'SECTOR EPSILON',
        floorColor: 0x080818, gridColor: 0x12122a,
        wallLayout: 'scattered', timeLimit: 80,
        waves: [
            { enemies: [{ type: 'drone', count: 8 }, { type: 'shooter', count: 3 }], delay: 0 },
            { enemies: [{ type: 'tank', count: 3 }, { type: 'drone', count: 6 }], delay: 2000 },
            { enemies: [{ type: 'shooter', count: 5 }, { type: 'tank', count: 2 }], delay: 2000 },
        ]
    },
    {
        id: 6, name: 'BOSS: SECTOR ZETA',
        floorColor: 0x120808, gridColor: 0x1e0808,
        wallLayout: 'boss_room', timeLimit: 130,
        waves: [
            { enemies: [{ type: 'drone', count: 8 }, { type: 'shooter', count: 3 }, { type: 'tank', count: 2 }], delay: 0 },
            { enemies: [{ type: 'boss', count: 1 }], delay: 3000 },
        ]
    },
    {
        id: 7, name: 'SECTOR ETA',
        floorColor: 0x080818, gridColor: 0x12122a,
        wallLayout: 'cross', timeLimit: 80,
        waves: [
            { enemies: [{ type: 'drone', count: 10 }, { type: 'tank', count: 3 }], delay: 0 },
            { enemies: [{ type: 'shooter', count: 6 }, { type: 'drone', count: 7 }], delay: 2000 },
            { enemies: [{ type: 'tank', count: 4 }, { type: 'shooter', count: 4 }], delay: 2000 },
        ]
    },
    {
        id: 8, name: 'SECTOR THETA',
        floorColor: 0x080818, gridColor: 0x12122a,
        wallLayout: 'corridors', timeLimit: 75,
        waves: [
            { enemies: [{ type: 'drone', count: 12 }, { type: 'shooter', count: 4 }], delay: 0 },
            { enemies: [{ type: 'tank', count: 5 }, { type: 'drone', count: 8 }], delay: 2000 },
            { enemies: [{ type: 'shooter', count: 6 }, { type: 'tank', count: 3 }, { type: 'drone', count: 5 }], delay: 2000 },
        ]
    },
    {
        id: 9, name: 'BOSS: FINAL SECTOR',
        floorColor: 0x120808, gridColor: 0x1e0808,
        wallLayout: 'boss_room', timeLimit: 150,
        waves: [
            { enemies: [{ type: 'drone', count: 10 }, { type: 'shooter', count: 5 }, { type: 'tank', count: 4 }], delay: 0 },
            { enemies: [{ type: 'boss', count: 1 }], delay: 3000 },
        ]
    },
];

function generateLevel(levelNum) {
    const scale = 1 + (levelNum - 9) * 0.35;
    const isBoss = levelNum % 3 === 0;
    const layouts = ['open', 'pillars', 'scattered', 'cross', 'corridors', 'boss_room'];
    const waves = [];
    if (!isBoss) {
        waves.push({ enemies: [
            { type: 'drone',   count: Math.floor(12 * scale) },
            { type: 'tank',    count: Math.floor(4  * scale) }
        ], delay: 0 });
        waves.push({ enemies: [
            { type: 'shooter', count: Math.floor(6  * scale) },
            { type: 'drone',   count: Math.floor(10 * scale) }
        ], delay: 2000 });
    } else {
        waves.push({ enemies: [
            { type: 'drone',   count: Math.floor(10 * scale) },
            { type: 'shooter', count: Math.floor(5  * scale) },
            { type: 'tank',    count: Math.floor(3  * scale) }
        ], delay: 0 });
        waves.push({ enemies: [{ type: 'boss', count: 1 }], delay: 3000 });
    }
    return {
        id: levelNum,
        name: isBoss ? `BOSS: DEEP SECTOR ${levelNum}` : `DEEP SECTOR ${levelNum}`,
        floorColor: isBoss ? 0x120808 : 0x080818,
        gridColor:  isBoss ? 0x1e0808 : 0x12122a,
        wallLayout: layouts[levelNum % layouts.length],
        timeLimit:  Math.max(60, 90 - levelNum * 2),
        waves,
    };
}

function getLevel(n) {
    if (n <= LEVELS.length) return LEVELS[n - 1];
    return generateLevel(n);
}
