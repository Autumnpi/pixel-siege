const LEVELS = [
    {
        id: 1,
        name: 'SECTOR ALPHA',
        floorColor: 0x080818,
        gridColor: 0x12122a,
        waves: [
            { enemies: [{ type: 'drone', count: 4 }], delay: 0 },
            { enemies: [{ type: 'drone', count: 6 }], delay: 1500 },
            { enemies: [{ type: 'drone', count: 5 }, { type: 'tank', count: 1 }], delay: 2000 },
        ]
    },
    {
        id: 2,
        name: 'SECTOR BETA',
        floorColor: 0x081008,
        gridColor: 0x121a12,
        waves: [
            { enemies: [{ type: 'drone', count: 5 }, { type: 'shooter', count: 1 }], delay: 0 },
            { enemies: [{ type: 'drone', count: 4 }, { type: 'tank', count: 2 }], delay: 2000 },
            { enemies: [{ type: 'shooter', count: 3 }, { type: 'drone', count: 4 }], delay: 2000 },
        ]
    },
    {
        id: 3,
        name: 'BOSS: SECTOR GAMMA',
        floorColor: 0x120808,
        gridColor: 0x1e0808,
        waves: [
            { enemies: [{ type: 'drone', count: 6 }, { type: 'shooter', count: 2 }], delay: 0 },
            { enemies: [{ type: 'boss', count: 1 }], delay: 3000 },
        ]
    },
    {
        id: 4,
        name: 'SECTOR DELTA',
        floorColor: 0x080818,
        gridColor: 0x12122a,
        waves: [
            { enemies: [{ type: 'drone', count: 7 }, { type: 'tank', count: 2 }], delay: 0 },
            { enemies: [{ type: 'shooter', count: 4 }, { type: 'drone', count: 5 }], delay: 2000 },
            { enemies: [{ type: 'tank', count: 3 }, { type: 'shooter', count: 3 }], delay: 2000 },
        ]
    },
    {
        id: 5,
        name: 'SECTOR EPSILON',
        floorColor: 0x080818,
        gridColor: 0x12122a,
        waves: [
            { enemies: [{ type: 'drone', count: 8 }, { type: 'shooter', count: 3 }], delay: 0 },
            { enemies: [{ type: 'tank', count: 3 }, { type: 'drone', count: 6 }], delay: 2000 },
            { enemies: [{ type: 'shooter', count: 5 }, { type: 'tank', count: 2 }], delay: 2000 },
        ]
    },
    {
        id: 6,
        name: 'BOSS: SECTOR ZETA',
        floorColor: 0x120808,
        gridColor: 0x1e0808,
        waves: [
            { enemies: [{ type: 'drone', count: 8 }, { type: 'shooter', count: 3 }, { type: 'tank', count: 2 }], delay: 0 },
            { enemies: [{ type: 'boss', count: 1 }], delay: 3000 },
        ]
    },
    {
        id: 7,
        name: 'SECTOR ETA',
        floorColor: 0x080818,
        gridColor: 0x12122a,
        waves: [
            { enemies: [{ type: 'drone', count: 10 }, { type: 'tank', count: 3 }], delay: 0 },
            { enemies: [{ type: 'shooter', count: 6 }, { type: 'drone', count: 7 }], delay: 2000 },
            { enemies: [{ type: 'tank', count: 4 }, { type: 'shooter', count: 4 }], delay: 2000 },
        ]
    },
    {
        id: 8,
        name: 'SECTOR THETA',
        floorColor: 0x080818,
        gridColor: 0x12122a,
        waves: [
            { enemies: [{ type: 'drone', count: 12 }, { type: 'shooter', count: 4 }], delay: 0 },
            { enemies: [{ type: 'tank', count: 5 }, { type: 'drone', count: 8 }], delay: 2000 },
            { enemies: [{ type: 'shooter', count: 6 }, { type: 'tank', count: 3 }, { type: 'drone', count: 5 }], delay: 2000 },
        ]
    },
    {
        id: 9,
        name: 'BOSS: FINAL SECTOR',
        floorColor: 0x120808,
        gridColor: 0x1e0808,
        waves: [
            { enemies: [{ type: 'drone', count: 10 }, { type: 'shooter', count: 5 }, { type: 'tank', count: 4 }], delay: 0 },
            { enemies: [{ type: 'boss', count: 1 }], delay: 3000 },
        ]
    },
];

function generateLevel(levelNum) {
    const scale = 1 + (levelNum - 9) * 0.35;
    const isBoss = levelNum % 3 === 0;
    const waves = [];
    if (!isBoss) {
        waves.push({ enemies: [
            { type: 'drone', count: Math.floor(12 * scale) },
            { type: 'tank', count: Math.floor(4 * scale) }
        ], delay: 0 });
        waves.push({ enemies: [
            { type: 'shooter', count: Math.floor(6 * scale) },
            { type: 'drone', count: Math.floor(10 * scale) }
        ], delay: 2000 });
    } else {
        waves.push({ enemies: [
            { type: 'drone', count: Math.floor(10 * scale) },
            { type: 'shooter', count: Math.floor(5 * scale) },
            { type: 'tank', count: Math.floor(3 * scale) }
        ], delay: 0 });
        waves.push({ enemies: [{ type: 'boss', count: 1 }], delay: 3000 });
    }
    return {
        id: levelNum,
        name: isBoss ? `BOSS: DEEP SECTOR ${levelNum}` : `DEEP SECTOR ${levelNum}`,
        floorColor: isBoss ? 0x120808 : 0x080818,
        gridColor: isBoss ? 0x1e0808 : 0x12122a,
        waves
    };
}

function getLevel(n) {
    if (n <= LEVELS.length) return LEVELS[n - 1];
    return generateLevel(n);
}
