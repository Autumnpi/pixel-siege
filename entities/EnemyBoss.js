class EnemyBoss extends EnemyBase {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_boss');
        this.hp         = 400;
        this.maxHp      = 400;
        this.speed      = 36;
        this.scoreValue = 200;
        this.contactDamage = 2;
        this._textureKey = 'enemy_boss';

        this._phase = 0;         // 0=approach, 1=burst, 2=charge, 3=spawn
        this._phaseTimer = 0;
        this._phaseDelay = 3500;
        this._chargeActive = false;
        this._chargeVx = 0;
        this._chargeVy = 0;
        this._chargeDuration = 0;
        this._healthBar = null;
        this._healthBarBg = null;
        this._hpLabel = null;
    }

    spawn(x, y) {
        super.spawn(x, y);
        this._phase = 0;
        this._phaseTimer = 0;
        this._chargeActive = false;
        // Scale HP with level (boss levels are 3, 6, 9...)
        const scale = 1 + Math.max(0, this.scene.levelNumber - 3) * 0.2;
        this.maxHp = Math.floor(400 * scale);
        this.hp = this.maxHp;

        this._createHealthBar();
    }

    _createHealthBar() {
        if (this._healthBar) { this._healthBar.destroy(); this._healthBarBg.destroy(); this._hpLabel.destroy(); }
        this._healthBarBg = this.scene.add.graphics().setDepth(30);
        this._healthBar   = this.scene.add.graphics().setDepth(31);
        this._hpLabel = this.scene.add.text(0, 0, 'BOSS', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#ff4444',
        }).setOrigin(0.5, 1).setDepth(32);
    }

    _move(player, time, delta) {
        if (this._chargeActive) return; // charge is handled in _act
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle), this.speed, this.body.velocity
        );
        this.setRotation(angle);
    }

    _act(time, delta) {
        this._phaseTimer += delta;

        // Update health bar position
        this._updateHealthBar();

        if (this._chargeActive) {
            this._chargeDuration -= delta;
            this.body.velocity.x = this._chargeVx;
            this.body.velocity.y = this._chargeVy;
            if (this._chargeDuration <= 0) {
                this._chargeActive = false;
                this.body.stop();
            }
            return;
        }

        if (this._phaseTimer < this._phaseDelay) return;
        this._phaseTimer = 0;
        this._phase = (this._phase + 1) % 3;

        switch (this._phase) {
            case 0: this._doBurstFire(); break;
            case 1: this._doCharge(); break;
            case 2: this._doSpawnMinions(); break;
        }
    }

    _doBurstFire() {
        const player = this.scene.player;
        if (!player || !player.active) return;
        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const spread = Math.PI / 5;
        for (let i = -2; i <= 2; i++) {
            const a = baseAngle + i * spread;
            this.scene.time.delayedCall(i * 80 + 80, () => {
                if (!this.active) return;
                this.scene.enemyBulletPool.fire(this.x, this.y, a);
                this.scene.audio.play('enemy_shoot');
            });
        }
    }

    _doCharge() {
        const player = this.scene.player;
        if (!player || !player.active) return;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const chargeSpeed = this.speed * 4;
        this._chargeVx = Math.cos(angle) * chargeSpeed;
        this._chargeVy = Math.sin(angle) * chargeSpeed;
        this._chargeDuration = 480;
        this._chargeActive = true;
    }

    _doSpawnMinions() {
        for (let i = 0; i < 2; i++) {
            const angle = (i / 2) * Math.PI * 2;
            const spawnX = this.x + Math.cos(angle) * 80;
            const spawnY = this.y + Math.sin(angle) * 80;
            const drone = this.scene.droneGroup.get();
            if (drone) {
                drone.spawn(spawnX, spawnY);
                this.scene.waveManager.enemiesAlive++;
            }
        }
    }

    _updateHealthBar() {
        if (!this._healthBar || !this.active) return;
        const W = 120, H = 8;
        const bx = this.x - W / 2;
        const by = this.y - 50;

        this._healthBarBg.clear();
        this._healthBarBg.fillStyle(0x330000, 1);
        this._healthBarBg.fillRect(bx - 1, by - 1, W + 2, H + 2);

        this._healthBar.clear();
        const ratio = Math.max(0, this.hp / this.maxHp);
        this._healthBar.fillStyle(0xff2222, 1);
        this._healthBar.fillRect(bx, by, W * ratio, H);
        if (ratio > 0.5) {
            this._healthBar.fillStyle(0xff6666, 0.5);
            this._healthBar.fillRect(bx, by, W * ratio, H / 2);
        }

        this._hpLabel.setPosition(this.x, by - 2);
        this._hpLabel.setText(`BOSS  ${this.hp}/${this.maxHp}`);
    }

    die() {
        if (this._healthBar) { this._healthBar.destroy(); this._healthBar = null; }
        if (this._healthBarBg) { this._healthBarBg.destroy(); this._healthBarBg = null; }
        if (this._hpLabel) { this._hpLabel.destroy(); this._hpLabel = null; }
        // Big explosion
        for (let i = 0; i < 8; i++) {
            this.scene.time.delayedCall(i * 120, () => {
                if (!this.scene) return;
                this.scene.spawnDeathEffect(
                    this.x + Phaser.Math.Between(-40, 40),
                    this.y + Phaser.Math.Between(-40, 40),
                    true
                );
            });
        }
        super.die();
    }
}
