class HUDScene extends Phaser.Scene {
    constructor() { super({ key: 'HUD' }); }

    init(data) {
        this._hp = CONSTANTS.PLAYER_HP;
        this._maxHp = CONSTANTS.PLAYER_HP;
        this._score = data.score || 0;
        this._wave = 1;
        this._totalWaves = 1;
        this._level = data.level || 1;
        this._levelName = data.levelName || '';
    }

    create() {
        const W = CONSTANTS.WIDTH;

        // Transparent overlay bar at top
        const bar = this.add.graphics();
        bar.fillStyle(0x000000, 0.55);
        bar.fillRect(0, 0, W, 38);

        // Health hearts
        this._hearts = [];
        for (let i = 0; i < this._maxHp; i++) {
            const h = this.add.image(14 + i * 28, 19, 'heart').setOrigin(0.5).setScale(0.9);
            this._hearts.push(h);
        }

        // Score
        this._scoreTxt = this.add.text(W - 12, 8, this._fmtScore(this._score), {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px', color: '#ffee00',
        }).setOrigin(1, 0);

        // Wave counter
        this._waveTxt = this.add.text(W / 2, 8, this._waveLbl(), {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px', color: '#aaffcc',
        }).setOrigin(0.5, 0);

        // Level name banner (bottom)
        this._levelBanner = this.add.text(W / 2, CONSTANTS.HEIGHT - 12, this._levelName, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px', color: '#444444',
        }).setOrigin(0.5, 1);

        // Wave transition message
        this._waveMsgTxt = this.add.text(W / 2, 70, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px', color: '#ffee00',
            stroke: '#553300', strokeThickness: 4,
        }).setOrigin(0.5).setAlpha(0);

        // Wire up game scene events
        const game = this.scene.get('Game');
        if (game) {
            game.events.on('scoreChanged',  this._onScore,   this);
            game.events.on('healthChanged', this._onHealth,  this);
            game.events.on('waveChanged',   this._onWave,    this);
        }

        this.events.once('shutdown', () => {
            const g2 = this.scene.get('Game');
            if (g2) {
                g2.events.off('scoreChanged',  this._onScore,   this);
                g2.events.off('healthChanged', this._onHealth,  this);
                g2.events.off('waveChanged',   this._onWave,    this);
            }
        });
    }

    _onScore(score) {
        this._score = score;
        this._scoreTxt.setText(this._fmtScore(score));
    }

    _onHealth(hp, maxHp) {
        this._hp = hp;
        this._maxHp = maxHp;
        this._hearts.forEach((h, i) => {
            h.setTint(i < hp ? 0xffffff : 0x331122);
            h.setAlpha(i < hp ? 1 : 0.35);
        });
    }

    _onWave(wave, total) {
        this._wave = wave;
        this._totalWaves = total;
        this._waveTxt.setText(this._waveLbl());

        this._waveMsgTxt.setText(`WAVE ${wave}`);
        this._waveMsgTxt.setAlpha(1);
        this.tweens.add({
            targets: this._waveMsgTxt,
            alpha: 0,
            duration: 1800,
            delay: 800,
            ease: 'Power2',
        });
    }

    _waveLbl() { return `WAVE ${this._wave}/${this._totalWaves}  ·  LV${this._level}`; }
    _fmtScore(s) { return 'SCORE: ' + String(s).padStart(6, '0'); }
}
