class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'Menu' }); }

    create() {
        this.audio = this.registry.get('audio');

        const W = CONSTANTS.WIDTH, H = CONSTANTS.HEIGHT;

        // Background
        this._drawBackground();

        // Title
        this.add.text(W / 2, 120, 'PIXEL', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '52px',
            color: '#00ff88',
            stroke: '#003322',
            strokeThickness: 6,
            shadow: { offsetX: 4, offsetY: 4, color: '#004422', blur: 0, fill: true }
        }).setOrigin(0.5);

        this.add.text(W / 2, 185, 'SIEGE', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '52px',
            color: '#ff4444',
            stroke: '#330000',
            strokeThickness: 6,
            shadow: { offsetX: 4, offsetY: 4, color: '#440000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(W / 2, 245, '— TOP-DOWN SHOOTER —', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px',
            color: '#888888',
        }).setOrigin(0.5);

        // Animated sprite showcase
        const cx = W / 2;
        this._addPreviewSprite('player',       cx - 160, 320, 'player',       1.2);
        this._addPreviewSprite('enemy_drone',  cx - 60,  330, 'enemy_drone',  1.0);
        this._addPreviewSprite('enemy_tank',   cx + 50,  325, 'enemy_tank',   1.0);
        this._addPreviewSprite('enemy_shooter',cx + 150, 320, 'enemy_shooter',1.0);

        // START button
        const startText = this.add.text(W / 2, 400, '[ PRESS ENTER OR CLICK ]', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '13px',
            color: '#ffee00',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Blink tween
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 520,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Controls hint
        this.add.text(W / 2, 455, 'WASD / ARROWS  =  MOVE', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px', color: '#666666',
        }).setOrigin(0.5);
        this.add.text(W / 2, 475, 'MOUSE AIM  +  CLICK  =  SHOOT', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px', color: '#666666',
        }).setOrigin(0.5);
        this.add.text(W / 2, 495, 'ESC  =  PAUSE', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px', color: '#666666',
        }).setOrigin(0.5);

        // High score
        const hs = localStorage.getItem('pixelsiege_hiscore') || 0;
        this.add.text(W / 2, 540, `HI-SCORE:  ${hs}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px', color: '#00ccff',
        }).setOrigin(0.5);

        // Credits
        this.add.text(W / 2, 575, 'v1.0  ·  CLAUDE + YOU', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px', color: '#444444',
        }).setOrigin(0.5);

        // Input
        const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        const space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        enter.once('down', () => this._startGame());
        space.once('down', () => this._startGame());
        startText.once('pointerdown', () => this._startGame());
        this.input.once('pointerdown', () => this._startGame());

        this.audio.resume();
        this.audio.startBGM();
    }

    _addPreviewSprite(animKey, x, y, textureKey, scale) {
        try {
            const s = this.add.sprite(x, y, textureKey, 0)
                .setScale(scale)
                .setOrigin(0.5);
            s.play(animKey, true);
        } catch(e) {
            this.add.image(x, y, textureKey).setScale(scale).setOrigin(0.5);
        }
    }

    _drawBackground() {
        const g = this.add.graphics();
        g.fillStyle(0x080818);
        g.fillRect(0, 0, CONSTANTS.WIDTH, CONSTANTS.HEIGHT);

        // Grid
        g.lineStyle(1, 0x14143a, 1);
        for (let x = 0; x < CONSTANTS.WIDTH; x += 40) g.lineBetween(x, 0, x, CONSTANTS.HEIGHT);
        for (let y = 0; y < CONSTANTS.HEIGHT; y += 40) g.lineBetween(0, y, CONSTANTS.WIDTH, y);

        // Vignette-style corner gradient using alpha rects
        const vigSize = 200;
        g.fillStyle(0x000000, 0.4);
        g.fillRect(0, 0, vigSize, CONSTANTS.HEIGHT);
        g.fillRect(CONSTANTS.WIDTH - vigSize, 0, vigSize, CONSTANTS.HEIGHT);
    }

    _startGame() {
        this.audio.resume(); // Must be in user-gesture handler to unlock AudioContext
        this.audio.stopBGM();
        this.scene.start('Game', { level: 1, score: 0 });
    }
}
