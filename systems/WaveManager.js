class WaveManager {
    constructor(scene, levelConfig) {
        this.scene = scene;
        this.waves = levelConfig.waves;
        this.currentWave = 0;
        this.enemiesAlive = 0;
        this.totalKilled = 0;
        this._active = false;
        this._transitioning = false;
    }

    start() {
        this._active = true;
        this._spawnWave(0);
    }

    onEnemyDied() {
        this.enemiesAlive = Math.max(0, this.enemiesAlive - 1);
        this.totalKilled++;

        if (this.enemiesAlive <= 0 && !this._transitioning) {
            this._transitioning = true;
            const isLast = this.currentWave >= this.waves.length - 1;
            if (isLast) {
                this.scene.time.delayedCall(1200, () => {
                    this.scene.audio.play('level_complete');
                    this.scene.events.emit('levelComplete');
                });
            } else {
                this.scene.audio.play('wave_clear');
                this.currentWave++;
                this.scene.events.emit('waveChanged', this.currentWave + 1, this.waves.length);
                // Brief pause then let the wave's own delay field control timing
                this.scene.time.delayedCall(200, () => {
                    this._transitioning = false;
                    this._spawnWave(this.currentWave);
                });
            }
        }
    }

    _spawnWave(index) {
        const wave = this.waves[index];
        this.scene.events.emit('waveChanged', index + 1, this.waves.length);

        // Flatten all enemies so they interleave rather than type-by-type
        const allEnemies = [];
        wave.enemies.forEach(group => {
            for (let i = 0; i < group.count; i++) allEnemies.push(group.type);
        });

        this.enemiesAlive += allEnemies.length;

        const initialDelay = wave.delay || 0;
        allEnemies.forEach((type, i) => {
            this.scene.time.delayedCall(initialDelay + i * 320, () => {
                this._spawnEnemy(type);
            });
        });
    }

    _spawnEnemy(type) {
        if (!this.scene || !this.scene.scene.isActive()) return;
        const pos = this._edgePosition();
        let enemy;
        switch (type) {
            case 'drone':   enemy = this.scene.droneGroup.get();   break;
            case 'tank':    enemy = this.scene.tankGroup.get();    break;
            case 'shooter': enemy = this.scene.shooterGroup.get(); break;
            case 'boss':    enemy = this.scene.bossGroup.get();    break;
            default:        enemy = this.scene.droneGroup.get();
        }
        if (enemy) {
            enemy.spawn(pos.x, pos.y);
        } else {
            // Pool exhausted — count as killed so wave can still progress
            this.onEnemyDied();
        }
    }

    _edgePosition() {
        const W = CONSTANTS.WIDTH;
        const H = CONSTANTS.HEIGHT;
        const M = CONSTANTS.SPAWN_MARGIN;
        const edge = Phaser.Math.Between(0, 3);
        switch (edge) {
            case 0: return { x: Phaser.Math.Between(0, W), y: -M };
            case 1: return { x: W + M, y: Phaser.Math.Between(0, H) };
            case 2: return { x: Phaser.Math.Between(0, W), y: H + M };
            default:return { x: -M, y: Phaser.Math.Between(0, H) };
        }
    }
}
