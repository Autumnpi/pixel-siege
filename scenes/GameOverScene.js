class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOver' }); }

    init(data) {
        this._score = data.score || 0;
        this._level = data.level || 1;
    }

    create() {
        const W = CONSTANTS.WIDTH, H = CONSTANTS.HEIGHT;
        this.audio = this.registry.get('audio');
        this.audio.play('game_over');

        // Update hi-score
        const prev = parseInt(localStorage.getItem('pixelsiege_hiscore') || '0', 10);
        const isNew = this._score > prev;
        if (isNew) localStorage.setItem('pixelsiege_hiscore', this._score);

        // Background overlay
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);

        // Frame
        const frame = this.add.graphics();
        frame.lineStyle(3, 0xff2222, 1);
        frame.strokeRect(80, 80, W - 160, H - 160);
        frame.fillStyle(0x1a0000, 0.9);
        frame.fillRect(81, 81, W - 162, H - 162);

        // GAME OVER text with flicker
        const goText = this.add.text(W / 2, 155, 'GAME OVER', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px',
            color: '#ff2222',
            stroke: '#440000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        // Flicker effect
        this.tweens.add({
            targets: goText,
            alpha: { from: 1, to: 0.4 },
            duration: 80,
            yoyo: true,
            repeat: 5,
        });

        // Score
        this.time.delayedCall(300, () => {
            this.add.text(W / 2, 250, `SCORE:  ${this._score}`, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '16px', color: '#ffee00',
            }).setOrigin(0.5);

            const hiScore = localStorage.getItem('pixelsiege_hiscore') || 0;
            const hsColor = isNew ? '#00ff88' : '#aaaaff';
            const hsPrefix = isNew ? '★ NEW HI-SCORE! ★' : `HI-SCORE:  ${hiScore}`;
            this.add.text(W / 2, 300, hsPrefix, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: isNew ? '12px' : '11px',
                color: hsColor,
            }).setOrigin(0.5);

            this.add.text(W / 2, 355, `REACHED SECTOR:  ${this._level}`, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '10px', color: '#888888',
            }).setOrigin(0.5);
        });

        // Buttons
        this.time.delayedCall(900, () => {
            const retryBtn = this._makeButton(W / 2 - 100, 440, 'RETRY', '#00ff88', () => {
                this.scene.start('Game', { level: 1, score: 0 });
            });
            const menuBtn = this._makeButton(W / 2 + 100, 440, 'MENU', '#aaaaff', () => {
                this.audio.startBGM();
                this.scene.start('Menu');
            });

            this.tweens.add({ targets: [retryBtn, menuBtn], alpha: { from: 0, to: 1 }, duration: 400 });
        });
    }

    _makeButton(x, y, label, color, callback) {
        const bg = this.add.graphics().setAlpha(0);
        bg.fillStyle(0x222222, 1);
        bg.fillRoundedRect(x - 65, y - 20, 130, 40, 6);
        bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
        bg.strokeRoundedRect(x - 65, y - 20, 130, 40, 6);

        const txt = this.add.text(x, y, label, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '13px', color,
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

        txt.on('pointerover', () => txt.setColor('#ffffff'));
        txt.on('pointerout',  () => txt.setColor(color));
        txt.once('pointerdown', callback);

        return txt;
    }
}
