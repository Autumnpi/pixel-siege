class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'Game' }); }

    init(data) {
        this.levelNumber = data.level || 1;
        this.score       = data.score || 0;
        this._paused     = false;
        this._over       = false;
    }

    create() {
        this.audio = this.registry.get('audio');
        const levelConfig = getLevel(this.levelNumber);

        // World physics — player confined to viewport; enemies can spawn outside
        this.physics.world.setBounds(0, 0, CONSTANTS.WIDTH, CONSTANTS.HEIGHT);

        // Draw floor
        this._createFloor(levelConfig);

        // Entity groups (pools)
        this.bulletPool      = new BulletPool(this);
        this.enemyBulletPool = new EnemyBulletPool(this);

        this.droneGroup = this.physics.add.group({
            classType: EnemyDrone,
            runChildUpdate: true,
            maxSize: 40,
            defaultKey: 'enemy_drone',
        });
        this.tankGroup = this.physics.add.group({
            classType: EnemyTank,
            runChildUpdate: true,
            maxSize: 15,
            defaultKey: 'enemy_tank',
        });
        this.shooterGroup = this.physics.add.group({
            classType: EnemyShooter,
            runChildUpdate: true,
            maxSize: 20,
            defaultKey: 'enemy_shooter',
        });
        this.bossGroup = this.physics.add.group({
            classType: EnemyBoss,
            runChildUpdate: true,
            maxSize: 2,
            defaultKey: 'enemy_boss',
        });

        // Player
        this.player = new Player(this, CONSTANTS.WIDTH / 2, CONSTANTS.HEIGHT / 2);

        // Collision setup
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

        // Wave manager
        this.waveManager = new WaveManager(this, levelConfig);

        // HUD
        this.scene.launch('HUD', {
            score: this.score,
            level: this.levelNumber,
            levelName: levelConfig.name,
        });

        // Game events
        this.events.once('playerDied', () => this._onPlayerDied());
        this.events.once('levelComplete', () => this._onLevelComplete());

        // Pause overlay (created but hidden)
        this._pauseOverlay = this._createPauseOverlay();

        // Start waves after brief delay
        this.time.delayedCall(800, () => {
            if (!this._over) this.waveManager.start();
        });

        // BGM
        this.audio.startBGM();

        // Announce level
        this._showLevelBanner(levelConfig.name);
    }

    update(time, delta) {
        if (this._paused || this._over) return;

        const pointer = this.input.activePointer;
        this.player.update(this.cursors, this.wasd, pointer, this.bulletPool, time);

        // Bullet depth sorting not needed — fixed depth works fine
    }

    // ── Public methods called by entities ───────────────────────

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
                    targets: g,
                    alpha: 0,
                    scaleX: isBig ? 3 : 2,
                    scaleY: isBig ? 3 : 2,
                    duration: isBig ? 500 : 350,
                    onComplete: () => g.destroy(),
                });
            });
        });

        // Scorch mark
        this.time.delayedCall(10, () => {
            if (!this.scene.isActive()) return;
            const scorch = this.add.graphics();
            scorch.fillStyle(0x221100, 0.7);
            scorch.fillCircle(0, 0, radius * 0.6);
            scorch.setPosition(x, y);
            scorch.setDepth(1);
            this.tweens.add({
                targets: scorch,
                alpha: 0,
                duration: 3000,
                onComplete: () => scorch.destroy(),
            });
        });
    }

    // ── Private ─────────────────────────────────────────────────

    _createFloor(levelConfig) {
        const g = this.add.graphics().setDepth(0);
        g.fillStyle(levelConfig.floorColor || 0x080818);
        g.fillRect(0, 0, CONSTANTS.WIDTH, CONSTANTS.HEIGHT);

        g.lineStyle(1, levelConfig.gridColor || 0x12122a, 1);
        for (let x = 0; x <= CONSTANTS.WIDTH; x += 40)  g.lineBetween(x, 0, x, CONSTANTS.HEIGHT);
        for (let y = 0; y <= CONSTANTS.HEIGHT; y += 40)  g.lineBetween(0, y, CONSTANTS.WIDTH, y);
    }

    _createPauseOverlay() {
        const W = CONSTANTS.WIDTH, H = CONSTANTS.HEIGHT;
        const container = this.add.container(0, 0).setDepth(100).setVisible(false);

        const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
        const txt = this.add.text(W / 2, H / 2 - 30, 'PAUSED', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px', color: '#ffffff',
        }).setOrigin(0.5);
        const hint = this.add.text(W / 2, H / 2 + 40, 'PRESS ESC TO RESUME', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px', color: '#888888',
        }).setOrigin(0.5);

        container.add([bg, txt, hint]);
        return container;
    }

    _togglePause() {
        this._paused = !this._paused;
        this._pauseOverlay.setVisible(this._paused);
        if (this._paused) {
            this.physics.pause();
        } else {
            this.physics.resume();
        }
    }

    _showLevelBanner(name) {
        const W = CONSTANTS.WIDTH, H = CONSTANTS.HEIGHT;
        const banner = this.add.text(W / 2, H / 2 - 20, name, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '20px',
            color: '#00ff88',
            stroke: '#003322',
            strokeThickness: 5,
        }).setOrigin(0.5).setDepth(50);

        const sub = this.add.text(W / 2, H / 2 + 25, 'GET READY!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px', color: '#ffee00',
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: [banner, sub],
            alpha: 0,
            duration: 600,
            delay: 1400,
            onComplete: () => { banner.destroy(); sub.destroy(); },
        });
    }

    _onPlayerDied() {
        if (this._over) return;
        this._over = true;
        this.physics.pause();

        this.time.delayedCall(1200, () => {
            this.scene.stop('HUD');
            this.audio.stopBGM();
            this.scene.start('GameOver', { score: this.score, level: this.levelNumber });
        });
    }

    _onLevelComplete() {
        if (this._over) return;
        this._over = true;

        // Freeze physics briefly for drama
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
