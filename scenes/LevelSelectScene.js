class LevelSelectScene extends Phaser.Scene {
    constructor() { super({ key: 'LevelSelect' }); }

    create() {
        this.audio = this.registry.get('audio');
        const W = CONSTANTS.WIDTH, H = CONSTANTS.HEIGHT;
        const maxLevel = parseInt(localStorage.getItem('pixelsiege_maxlevel') || '1', 10);

        // Background
        this._drawBg();

        // Title
        this.add.text(W / 2, 38, 'SELECT MISSION', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '20px',
            color: '#00ff88', stroke: '#003322', strokeThickness: 5,
        }).setOrigin(0.5);

        this.add.text(W / 2, 75, `SECTORS UNLOCKED: ${Math.min(maxLevel, 9)} / 9`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#335533',
        }).setOrigin(0.5);

        // 3×3 grid
        const cardW = 216, cardH = 88, gapX = 14, gapY = 12;
        const totalW = 3 * cardW + 2 * gapX;
        const startX = (W - totalW) / 2;
        const startY = 105;

        for (let i = 0; i < 9; i++) {
            const col = i % 3, row = Math.floor(i / 3);
            const cx  = startX + col * (cardW + gapX) + cardW / 2;
            const cy  = startY + row * (cardH + gapY) + cardH / 2;
            this._drawCard(cx, cy, cardW, cardH, i + 1, maxLevel);
        }

        // Back / controls hint
        this.add.text(W / 2, H - 30, '[ ESC  —  BACK TO MENU ]', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#334433',
        }).setOrigin(0.5);

        const esc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        esc.once('down', () => {
            this.audio.startBGM();
            this.scene.start('Menu');
        });

        // Resume menu music if not already playing
        this.audio.startBGM();
    }

    _drawCard(cx, cy, w, h, levelNum, maxLevel) {
        const unlocked = levelNum <= maxLevel;
        const isBoss   = levelNum % 3 === 0;
        const isLatest = levelNum === maxLevel && unlocked;
        const level    = LEVELS[levelNum - 1];

        const g = this.add.graphics();

        if (unlocked) {
            const bgCol     = isBoss ? 0x1c0606 : 0x06091c;
            const borderCol = isLatest ? 0x00ff88 : (isBoss ? 0xcc3333 : 0x2255aa);
            const borderW   = isLatest ? 3 : 2;

            const draw = (highlight) => {
                g.clear();
                g.fillStyle(highlight ? (isBoss ? 0x2c0a0a : 0x0a0f30) : bgCol, 1);
                g.fillRoundedRect(cx - w/2, cy - h/2, w, h, 7);
                g.lineStyle(highlight ? 3 : borderW, highlight ? 0xffffff : borderCol, highlight ? 0.7 : 1);
                g.strokeRoundedRect(cx - w/2, cy - h/2, w, h, 7);
            };
            draw(false);

            // Level number
            this.add.text(cx - w/2 + 12, cy - h/2 + 11,
                String(levelNum).padStart(2, '0'), {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '17px',
                color: isBoss ? '#ff5555' : '#00ccff',
            });

            // Level name (wrapped)
            this.add.text(cx, cy + 8, level.name, {
                fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#778899',
                wordWrap: { width: w - 28 },
            }).setOrigin(0.5);

            // Interactive zone
            const zone = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
            zone.on('pointerover',  () => draw(true));
            zone.on('pointerout',   () => draw(false));
            zone.once('pointerdown', () => {
                this.audio.stopBGM();
                this.scene.start('Game', { level: levelNum, score: 0 });
            });

        } else {
            // Locked
            g.fillStyle(0x080808, 1);
            g.fillRoundedRect(cx - w/2, cy - h/2, w, h, 7);
            g.lineStyle(1, 0x1a1a1a, 1);
            g.strokeRoundedRect(cx - w/2, cy - h/2, w, h, 7);

            this.add.text(cx, cy - 12, String(levelNum).padStart(2, '0'), {
                fontFamily: '"Press Start 2P", monospace', fontSize: '14px', color: '#222222',
            }).setOrigin(0.5);

            this.add.text(cx, cy + 12, 'LOCKED', {
                fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#2a2a2a',
            }).setOrigin(0.5);
        }
    }

    _drawBg() {
        const g = this.add.graphics();
        g.fillStyle(0x080818);
        g.fillRect(0, 0, CONSTANTS.WIDTH, CONSTANTS.HEIGHT);
        g.lineStyle(1, 0x14143a, 1);
        for (let x = 0; x < CONSTANTS.WIDTH;  x += 40) g.lineBetween(x, 0, x, CONSTANTS.HEIGHT);
        for (let y = 0; y < CONSTANTS.HEIGHT; y += 40) g.lineBetween(0, y, CONSTANTS.WIDTH, y);
    }
}
