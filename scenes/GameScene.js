class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'Game' }); }

    init(data) {
        this.levelNumber = data.level || 1;
        this.score       = data.score || 0;
        this._paused     = false;
        this._over       = false;
        this._timeLeft   = 120;
        this._timerActive = false;
    }

    create() {
        this.audio = this.registry.get('audio');
        const levelConfig = getLevel(this.levelNumber);

        this.physics.world.setBounds(0, 0, CONSTANTS.WIDTH, CONSTANTS.HEIGHT);

        this._createFloor(levelConfig);
        this._createWalls(levelConfig);

        // Entity groups / pools
        this.bulletPool      = new BulletPool(this);
        this.enemyBulletPool = new EnemyBulletPool(this);

        this.droneGroup = this.physics.add.group({
            classType: EnemyDrone,   runChildUpdate: true, maxSize: 40, defaultKey: 'enemy_drone',
        });
        this.tankGroup = this.physics.add.group({
            classType: EnemyTank,    runChildUpdate: true, maxSize: 15, defaultKey: 'enemy_tank',
        });
        this.shooterGroup = this.physics.add.group({
            classType: EnemyShooter, runChildUpdate: true, maxSize: 20, defaultKey: 'enemy_shooter',
        });
        this.bossGroup = this.physics.add.group({
            classType: EnemyBoss,    runChildUpdate: true, maxSize: 2,  defaultKey: 'enemy_boss',
        });

        this.player = new Player(this, CONSTANTS.WIDTH / 2, CONSTANTS.HEIGHT / 2);
        CollisionManager.setup(this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up:    Phaser.Input.Keyboard.KeyCodes.W,
            down:  Phaser.Input.Keyboard.KeyCodes.S,
            left:  Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        });
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => this._togglePause());

        // Q key fires charge shot
        this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.qKey.on('down', () => {
            if (!this._paused && !this._over && this.player && this.player.active) {
                this.player.useChargeMeter(this.bulletPool);
            }
        });

        // Charge ring — shown when meter is ready (driven from player._chargeMeter in update)
        this._chargeRing = this.add.graphics().setDepth(14);

        // Timer
        this._timeLeft    = levelConfig.timeLimit || 120;
        this._timerActive = false;

        // Wave manager
        this.waveManager = new WaveManager(this, levelConfig);

        // HUD
        this.scene.launch('HUD', {
            score: this.score,
            level: this.levelNumber,
            levelName: levelConfig.name,
        });

        // Game events
        this.events.once('playerDied',    () => this._onPlayerDied());
        this.events.once('levelComplete', () => this._onLevelComplete());
        this.events.on('waveChanged', (wave) => this.audio.setWave(wave));

        this._pauseOverlay = this._createPauseOverlay();

        this.time.delayedCall(800, () => {
            if (!this._over) {
                this.waveManager.start();
                this._timerActive = true;
            }
        });

        this.audio.startBGM(this.levelNumber);
        this._showLevelBanner(levelConfig.name);
    }

    update(time, delta) {
        if (this._paused || this._over) return;

        const pointer = this.input.activePointer;
        this.player.update(this.cursors, this.wasd, pointer, this.bulletPool, time);

        // Timer countdown
        if (this._timerActive) {
            this._timeLeft = Math.max(0, this._timeLeft - delta / 1000);
            this.events.emit('timerTick', this._timeLeft);
            if (this._timeLeft <= 0) {
                this._timerActive = false;
                this._onTimerExpired();
            }
        }

        // Charge ring — glows around player when charge meter is usable
        this._chargeRing.clear();
        if (this.player.active && this.player._chargeMeter >= CONSTANTS.CHARGE_MIN_PCT) {
            const pct   = this.player._chargeMeter / 100;
            const r     = 22 + pct * 12;
            const alpha = 0.3 + pct * 0.5;
            const thick = 2 + Math.floor(pct * 3);
            const color = this.player._chargeMeter >= 100 ? 0x00ffff :
                          this.player._chargeMeter >= 80  ? 0xff6600 : 0x00ff88;
            this._chargeRing.lineStyle(thick, color, alpha);
            this._chargeRing.strokeCircle(this.player.x, this.player.y, r);
            if (this.player._chargeMeter >= 100) {
                this._chargeRing.fillStyle(0x00ffff, 0.06);
                this._chargeRing.fillCircle(this.player.x, this.player.y, r);
            }
        }
    }

    // ── Public (called by entities) ──────────────────────────────

    onEnemyKilled(points) {
        this.score += points;
        this.events.emit('scoreChanged', this.score);
        this.waveManager.onEnemyDied();
    }

    spawnDeathEffect(x, y, isBig) {
        const radius = isBig ? 35 : 18;
        const colors = isBig
            ? [0xff4400, 0xff8800, 0xffcc00, 0xffffff]
            : [0xff6600, 0xffaa00, 0xffee44];

        colors.forEach((color, i) => {
            this.time.delayedCall(i * 60, () => {
                if (!this.scene.isActive()) return;
                const g = this.add.graphics();
                g.fillStyle(color, 1);
                g.fillCircle(0, 0, radius - i * 4);
                g.setPosition(x + Phaser.Math.Between(-8, 8), y + Phaser.Math.Between(-8, 8));
                g.setDepth(25);
                this.tweens.add({
                    targets: g, alpha: 0,
                    scaleX: isBig ? 3 : 2, scaleY: isBig ? 3 : 2,
                    duration: isBig ? 500 : 350,
                    onComplete: () => g.destroy(),
                });
            });
        });

        this.time.delayedCall(10, () => {
            if (!this.scene.isActive()) return;
            const scorch = this.add.graphics();
            scorch.fillStyle(0x221100, 0.7);
            scorch.fillCircle(0, 0, radius * 0.6);
            scorch.setPosition(x, y).setDepth(1);
            this.tweens.add({
                targets: scorch, alpha: 0, duration: 3000,
                onComplete: () => scorch.destroy(),
            });
        });
    }

    // ── Private ──────────────────────────────────────────────────

    _createFloor(levelConfig) {
        const g = this.add.graphics().setDepth(0);
        g.fillStyle(levelConfig.floorColor || 0x080818);
        g.fillRect(0, 0, CONSTANTS.WIDTH, CONSTANTS.HEIGHT);
        g.lineStyle(1, levelConfig.gridColor || 0x12122a, 1);
        for (let x = 0; x <= CONSTANTS.WIDTH;  x += 40) g.lineBetween(x, 0, x, CONSTANTS.HEIGHT);
        for (let y = 0; y <= CONSTANTS.HEIGHT; y += 40) g.lineBetween(0, y, CONSTANTS.WIDTH, y);
    }

    _createWalls(levelConfig) {
        const layout = WALL_LAYOUTS[levelConfig.wallLayout || 'open'] || [];
        if (!layout.length) { this.wallGroup = null; return; }

        this.wallGroup = this.physics.add.staticGroup();

        layout.forEach(rect => {
            const cx = rect.x + rect.w / 2;
            const cy = rect.y + rect.h / 2;

            // Visual
            const g = this.add.graphics().setDepth(5);
            g.fillStyle(0x2a3d4f, 1);
            g.fillRect(rect.x, rect.y, rect.w, rect.h);
            g.lineStyle(2, 0x4a6d8f, 1);
            g.strokeRect(rect.x, rect.y, rect.w, rect.h);
            // Highlight edge
            g.lineStyle(1, 0x7aadcf, 0.35);
            g.lineBetween(rect.x + 2, rect.y + 2, rect.x + rect.w - 2, rect.y + 2);
            g.lineBetween(rect.x + 2, rect.y + 2, rect.x + 2, rect.y + rect.h - 2);

            // Physics body
            const physRect = this.add.rectangle(cx, cy, rect.w, rect.h);
            this.physics.add.existing(physRect, true);
            this.wallGroup.add(physRect);
        });
    }

    _createPauseOverlay() {
        const W = CONSTANTS.WIDTH, H = CONSTANTS.HEIGHT;
        const container = this.add.container(0, 0).setDepth(100).setVisible(false);
        const bg   = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
        const txt  = this.add.text(W / 2, H / 2 - 30, 'PAUSED', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '36px', color: '#ffffff',
        }).setOrigin(0.5);
        const hint = this.add.text(W / 2, H / 2 + 40, 'PRESS ESC TO RESUME', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: '#888888',
        }).setOrigin(0.5);
        container.add([bg, txt, hint]);
        return container;
    }

    _togglePause() {
        this._paused = !this._paused;
        this._pauseOverlay.setVisible(this._paused);
        if (this._paused) this.physics.pause();
        else              this.physics.resume();
    }

    _showLevelBanner(name) {
        const W = CONSTANTS.WIDTH, H = CONSTANTS.HEIGHT;
        const banner = this.add.text(W / 2, H / 2 - 20, name, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '20px',
            color: '#00ff88', stroke: '#003322', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(50);
        const sub = this.add.text(W / 2, H / 2 + 25, 'GET READY!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '12px', color: '#ffee00',
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({
            targets: [banner, sub], alpha: 0, duration: 600, delay: 1400,
            onComplete: () => { banner.destroy(); sub.destroy(); },
        });
    }

    _onTimerExpired() {
        this.audio.play('timer_expired');
        this.events.emit('timerExpired');
        this.time.delayedCall(2500, () => {
            if (!this._over) this.events.emit('playerDied');
        });
    }

    _onPlayerDied() {
        if (this._over) return;
        this._over = true;
        this.physics.pause();
        this.audio.stopBGM();

        this.time.delayedCall(1200, () => {
            this.scene.stop('HUD');
            this.scene.start('GameOver', { score: this.score, level: this.levelNumber });
        });
    }

    _onLevelComplete() {
        if (this._over) return;
        this._over = true;

        // Unlock next level
        const maxLevel = parseInt(localStorage.getItem('pixelsiege_maxlevel') || '1', 10);
        if (this.levelNumber + 1 > maxLevel) {
            localStorage.setItem('pixelsiege_maxlevel', String(this.levelNumber + 1));
        }

        this.time.delayedCall(600, () => {
            this.scene.stop('HUD');
            this.audio.stopBGM();
            this.scene.start('LevelComplete', {
                level:  this.levelNumber,
                score:  this.score,
                killed: this.waveManager.totalKilled,
            });
        });
    }
}
