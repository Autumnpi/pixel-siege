class LevelCompleteScene extends Phaser.Scene {
    constructor() { super({ key: 'LevelComplete' }); }

    init(data) {
        this._level     = data.level  || 1;
        this._score     = data.score  || 0;
        this._killed    = data.killed || 0;
        this._nextLevel = data.level + 1;
    }

    create() {
        const W = CONSTANTS.WIDTH, H = CONSTANTS.HEIGHT;
        this.audio = this.registry.get('audio');
        this.audio.play('level_complete');

        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75);

        const frame = this.add.graphics();
        frame.lineStyle(3, 0x00ff88, 1);
        frame.strokeRect(80, 100, W - 160, H - 200);
        frame.fillStyle(0x001a0a, 0.9);
        frame.fillRect(81, 101, W - 162, H - 202);

        const heading = this.add.text(W / 2, 150, 'LEVEL COMPLETE!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '22px',
            color: '#00ff88', stroke: '#003322', strokeThickness: 5,
        }).setOrigin(0.5).setAlpha(0);

        const statsY = 255;
        const levelLine = this.add.text(W / 2, statsY, `SECTOR  ${this._level}  CLEARED`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: '#ffee00',
        }).setOrigin(0.5).setAlpha(0);

        const killLine = this.add.text(W / 2, statsY + 42, `ENEMIES DESTROYED:  ${this._killed}`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: '#aaaaff',
        }).setOrigin(0.5).setAlpha(0);

        const scoreLine = this.add.text(W / 2, statsY + 84, `SCORE:  ${this._score}`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '13px', color: '#ffee00',
        }).setOrigin(0.5).setAlpha(0);

        const nextTxt = this.add.text(W / 2, H - 175, `NEXT: SECTOR ${this._nextLevel}`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#00ccff',
        }).setOrigin(0.5).setAlpha(0);

        const continueTxt = this.add.text(W / 2, H - 140, '[ CLICK OR ENTER  —  CONTINUE ]', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#ffffff',
        }).setOrigin(0.5).setAlpha(0);

        const selectTxt = this.add.text(W / 2, H - 110, '[ TAB  —  LEVEL SELECT ]', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#888888',
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });
        selectTxt.on('pointerdown', () => this.scene.start('LevelSelect'));

        // Reveal sequence
        this.time.delayedCall(100,  () => this._fadeIn(heading));
        this.time.delayedCall(500,  () => this._fadeIn(levelLine));
        this.time.delayedCall(800,  () => this._fadeIn(killLine));
        this.time.delayedCall(1100, () => this._fadeIn(scoreLine));
        this.time.delayedCall(1600, () => {
            this._fadeIn(nextTxt);
            this._fadeIn(continueTxt);
            this._fadeIn(selectTxt);
            this._setupContinue(selectTxt);
        });

        this.time.delayedCall(1700, () => {
            this.tweens.add({
                targets: continueTxt, alpha: 0.1, duration: 500, yoyo: true, repeat: -1,
            });
        });
    }

    _fadeIn(target) {
        this.tweens.add({ targets: target, alpha: 1, duration: 400 });
    }

    _setupContinue(selectTxt) {
        const proceed = () => this.scene.start('Game', { level: this._nextLevel, score: this._score });
        const enter   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        const tab     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        enter.once('down', proceed);
        tab.once('down', () => this.scene.start('LevelSelect'));
        this.input.once('pointerdown', (ptr, objs) => {
            if (!objs.includes(selectTxt)) proceed();
        });
    }
}
