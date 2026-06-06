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
        this._chargeFullTween = null;
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

        // ── Charge meter (bottom-left, always visible) ──────────
        // Layout: label row, bar row, status row
        const barLeft = 10;
        const barTop  = H - 52;
        const barW    = 160;
        const barH    = 12;

        // Bottom-left panel background
        const panelG = this.add.graphics();
        panelG.fillStyle(0x000000, 0.45);
        panelG.fillRect(barLeft - 4, barTop - 18, barW + 30, 58);

        // Label + key hint
        this.add.text(barLeft, barTop - 14, 'CHARGE', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '6px', color: '#336655',
        }).setOrigin(0, 0);
        this._chargeKeyHint = this.add.text(barLeft + barW - 2, barTop - 14, '[Q]', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '6px', color: '#335544',
        }).setOrigin(1, 0);

        // Bar background
        const barBgG = this.add.graphics();
        barBgG.fillStyle(0x0a1a14, 1);
        barBgG.fillRect(barLeft, barTop, barW, barH);
        barBgG.lineStyle(1, 0x224433, 1);
        barBgG.strokeRect(barLeft, barTop, barW, barH);

        // Bar fill (redrawn on chargeChanged)
        this._chargeFillG = this.add.graphics();

        // Percentage text (right of bar)
        this._chargePctTxt = this.add.text(barLeft + barW + 5, barTop + barH / 2, '0%', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '6px', color: '#224433',
        }).setOrigin(0, 0.5);

        // Status text (below bar)
        this._chargeStatusTxt = this.add.text(barLeft + barW / 2, barTop + barH + 8, 'DEAL DAMAGE', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '6px', color: '#224433',
        }).setOrigin(0.5, 0);

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
            if (this._chargeFullTween) this._chargeFullTween.stop();
        });

        // Store layout constants for _onCharge
        this._barLeft = barLeft;
        this._barTop  = barTop;
        this._barW    = barW;
        this._barH    = barH;
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
        const flash = this.add.rectangle(
            CONSTANTS.WIDTH / 2, CONSTANTS.HEIGHT / 2,
            CONSTANTS.WIDTH, CONSTANTS.HEIGHT, 0xff0000, 0
        ).setDepth(90);
        this.tweens.add({
            targets: flash, alpha: 0.45, duration: 180, yoyo: true, repeat: 4,
            onComplete: () => flash.destroy(),
        });
    }

    // meter = 0–100
    _onCharge(meter) {
        const { _barLeft: bx, _barTop: by, _barW: bw, _barH: bh } = this;
        if (!bx) return;

        const pct   = meter / 100;
        const fillW = Math.floor(bw * pct);

        let fillColor;
        if (meter < CONSTANTS.CHARGE_MIN_PCT)  fillColor = 0x0d2a1e;  // dim — not yet usable
        else if (meter < 50)                    fillColor = 0x00aa44;  // green — low charge
        else if (meter < 80)                    fillColor = 0xddaa00;  // yellow — medium
        else if (meter < 100)                   fillColor = 0xff6600;  // orange — nearly full
        else                                    fillColor = 0x00ffff;  // cyan — max power

        this._chargeFillG.clear();
        if (fillW > 0) {
            this._chargeFillG.fillStyle(fillColor, 1);
            this._chargeFillG.fillRect(bx, by, fillW, bh);
        }

        this._chargePctTxt.setText(`${Math.floor(meter)}%`);
        this._chargePctTxt.setColor(meter >= CONSTANTS.CHARGE_MIN_PCT ? '#aaffcc' : '#224433');

        if (meter >= 100) {
            this._chargeStatusTxt.setText('* MAX POWER *').setColor('#00ffff').setAlpha(1);
            if (!this._chargeFullTween) {
                this._chargeFullTween = this.tweens.add({
                    targets: this._chargeStatusTxt, alpha: 0.2, duration: 280, yoyo: true, repeat: -1,
                });
            }
        } else if (meter >= CONSTANTS.CHARGE_MIN_PCT) {
            if (this._chargeFullTween) {
                this._chargeFullTween.stop();
                this._chargeFullTween = null;
                this._chargeStatusTxt.setAlpha(1);
            }
            this._chargeStatusTxt.setText('[Q] FIRE READY').setColor('#00ff88');
        } else {
            if (this._chargeFullTween) {
                this._chargeFullTween.stop();
                this._chargeFullTween = null;
                this._chargeStatusTxt.setAlpha(1);
            }
            this._chargeStatusTxt.setText('DEAL DAMAGE').setColor('#224433');
        }
    }

    _waveLbl()    { return `WAVE ${this._wave}/${this._totalWaves}  LV${this._level}`; }
    _fmtScore(s) { return 'SCORE: ' + String(s).padStart(6, '0'); }
}
