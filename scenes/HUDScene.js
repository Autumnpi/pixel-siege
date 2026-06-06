class HUDScene extends Phaser.Scene {
    constructor() { super({ key: 'HUD' }); }

    init(data) {
        this._hp        = CONSTANTS.PLAYER_HP;
        this._maxHp     = CONSTANTS.PLAYER_HP;
        this._score     = data.score || 0;
        this._wave      = 1;
        this._totalWaves = 1;
        this._level     = data.level || 1;
        this._levelName = data.levelName || '';
        this._timerFlashing = false;
    }

    create() {
        const W = CONSTANTS.WIDTH, H = CONSTANTS.HEIGHT;

        // Top bar background
        const bar = this.add.graphics();
        bar.fillStyle(0x000000, 0.55);
        bar.fillRect(0, 0, W, 38);

        // Health hearts
        this._hearts = [];
        for (let i = 0; i < this._maxHp; i++) {
            const h = this.add.image(14 + i * 28, 19, 'heart').setOrigin(0.5).setScale(0.9);
            this._hearts.push(h);
        }

        // Score (right-aligned)
        this._scoreTxt = this.add.text(W - 12, 8, this._fmtScore(this._score), {
            fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: '#ffee00',
        }).setOrigin(1, 0);

        // Wave counter (left of centre)
        this._waveTxt = this.add.text(W / 2 - 10, 8, this._waveLbl(), {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#aaffcc',
        }).setOrigin(1, 0);

        // Timer (right of centre)
        this._timerTxt = this.add.text(W / 2 + 10, 8, '--:--', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#aaaaff',
        }).setOrigin(0, 0);

        // Level name banner (bottom)
        this._levelBanner = this.add.text(W / 2, H - 12, this._levelName, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#444444',
        }).setOrigin(0.5, 1);

        // Wave pop message
        this._waveMsgTxt = this.add.text(W / 2, 70, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px', color: '#ffee00',
            stroke: '#553300', strokeThickness: 4,
        }).setOrigin(0.5).setAlpha(0);

        // Charge bar (bottom-left)
        const barX = 10, barY = H - 18;
        this._chargeLbl     = this.add.text(barX, barY - 14, 'CHARGE', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '6px', color: '#006688',
        }).setAlpha(0);
        this._chargeBgRect  = this.add.rectangle(barX + 60, barY, 120, 10, 0x112233).setAlpha(0);
        this._chargeFill    = this.add.rectangle(barX, barY, 0, 10, 0x006699).setOrigin(0, 0.5).setAlpha(0);

        // Wire up game scene events
        const game = this.scene.get('Game');
        if (game) {
            game.events.on('scoreChanged',  this._onScore,        this);
            game.events.on('healthChanged', this._onHealth,       this);
            game.events.on('waveChanged',   this._onWave,         this);
            game.events.on('timerTick',     this._onTimer,        this);
            game.events.on('timerExpired',  this._onTimerExpired, this);
            game.events.on('chargeChanged', this._onCharge,       this);
        }

        this.events.once('shutdown', () => {
            const g2 = this.scene.get('Game');
            if (g2) {
                g2.events.off('scoreChanged',  this._onScore,        this);
                g2.events.off('healthChanged', this._onHealth,       this);
                g2.events.off('waveChanged',   this._onWave,         this);
                g2.events.off('timerTick',     this._onTimer,        this);
                g2.events.off('timerExpired',  this._onTimerExpired, this);
                g2.events.off('chargeChanged', this._onCharge,       this);
            }
        });
    }

    _onScore(score) {
        this._scoreTxt.setText(this._fmtScore(score));
    }

    _onHealth(hp, maxHp) {
        this._hearts.forEach((h, i) => {
            h.setTint(i < hp ? 0xffffff : 0x331122);
            h.setAlpha(i < hp ? 1 : 0.35);
        });
    }

    _onWave(wave, total) {
        this._wave = wave;
        this._totalWaves = total;
        this._waveTxt.setText(this._waveLbl());
        this._waveMsgTxt.setText(`WAVE ${wave}`).setAlpha(1);
        this.tweens.add({
            targets: this._waveMsgTxt, alpha: 0, duration: 1800, delay: 800, ease: 'Power2',
        });
    }

    _onTimer(timeLeft) {
        const mins = Math.floor(timeLeft / 60);
        const secs = Math.floor(timeLeft % 60);
        this._timerTxt.setText(`${mins}:${String(secs).padStart(2, '0')}`);
        const urgent = timeLeft <= 30;
        this._timerTxt.setColor(urgent ? '#ff4444' : '#aaaaff');
        if (urgent && !this._timerFlashing) {
            this._timerFlashing = true;
            this.tweens.add({
                targets: this._timerTxt, alpha: 0.2, duration: 400, yoyo: true, repeat: -1,
            });
        }
    }

    _onTimerExpired() {
        this.tweens.killTweensOf(this._timerTxt);
        this._timerTxt.setAlpha(1).setText('TIME UP!').setColor('#ff0000');
        // Full-screen red flash
        const flash = this.add.rectangle(
            CONSTANTS.WIDTH / 2, CONSTANTS.HEIGHT / 2,
            CONSTANTS.WIDTH, CONSTANTS.HEIGHT, 0xff0000, 0
        ).setDepth(90);
        this.tweens.add({
            targets: flash, alpha: 0.45, duration: 180, yoyo: true, repeat: 4,
            onComplete: () => flash.destroy(),
        });
    }

    _onCharge(pct) {
        if (pct > 0) {
            this._chargeBgRect.setAlpha(0.7);
            this._chargeLbl.setAlpha(1);
            this._chargeFill.setAlpha(1);
            this._chargeFill.setSize(Math.floor(120 * pct), 10);
            this._chargeFill.setFillStyle(pct >= 1 ? 0x00ffff : 0x006699);
        } else {
            this._chargeBgRect.setAlpha(0);
            this._chargeLbl.setAlpha(0);
            this._chargeFill.setSize(0, 10).setAlpha(0);
        }
    }

    _waveLbl()    { return `WAVE ${this._wave}/${this._totalWaves}  LV${this._level}`; }
    _fmtScore(s) { return 'SCORE: ' + String(s).padStart(6, '0'); }
}
