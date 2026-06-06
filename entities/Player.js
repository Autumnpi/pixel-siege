class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body.setSize(16, 16);
        this.setDepth(15);
        this.setOrigin(0.5, 0.5);

        this.hp = CONSTANTS.PLAYER_HP;
        this.maxHp = CONSTANTS.PLAYER_HP;
        this.lastShot = -9999;
        this.invincible = false;

        // Charge meter (0–100, fills as player deals damage)
        this._chargeMeter = 0;

        this.play('player');
    }

    update(cursors, wasd, pointer, bulletPool, time) {
        this._handleMovement(cursors, wasd);
        this._handleAim(pointer);
        this._handleShooting(pointer, bulletPool, time);
    }

    _handleMovement(cursors, wasd) {
        let vx = 0, vy = 0;
        const S = CONSTANTS.PLAYER_SPEED;

        if (cursors.left.isDown  || wasd.left.isDown)  vx = -S;
        if (cursors.right.isDown || wasd.right.isDown) vx =  S;
        if (cursors.up.isDown    || wasd.up.isDown)    vy = -S;
        if (cursors.down.isDown  || wasd.down.isDown)  vy =  S;

        if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }

        this.setVelocity(vx, vy);
        this.anims.play('player', true);
    }

    _handleAim(pointer) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
        this.setRotation(angle);
    }

    _handleShooting(pointer, bulletPool, time) {
        if (pointer.isDown && time > this.lastShot + CONSTANTS.BULLET_COOLDOWN) {
            this._fireNormal(bulletPool, time);
        }
    }

    // Called by CollisionManager whenever a player bullet deals damage
    addChargeMeter(pct) {
        const prev = this._chargeMeter;
        this._chargeMeter = Math.min(100, this._chargeMeter + pct);
        if (Math.floor(this._chargeMeter) !== Math.floor(prev)) {
            this.scene.events.emit('chargeChanged', this._chargeMeter);
            // Play ready sound at the threshold crossing
            if (prev < CONSTANTS.CHARGE_MIN_PCT && this._chargeMeter >= CONSTANTS.CHARGE_MIN_PCT) {
                this.scene.audio.play('charge_ready');
            }
        }
    }

    // Called when player presses Q — fires at whatever meter level is available
    useChargeMeter(bulletPool) {
        if (this._chargeMeter < CONSTANTS.CHARGE_MIN_PCT) return;

        const pct    = this._chargeMeter / 100;
        const damage = CONSTANTS.CHARGE_DAMAGE_MIN +
                       Math.round(pct * (CONSTANTS.CHARGE_DAMAGE_MAX - CONSTANTS.CHARGE_DAMAGE_MIN));
        const size   = CONSTANTS.CHARGE_SIZE_MIN +
                       pct * (CONSTANTS.CHARGE_SIZE_MAX - CONSTANTS.CHARGE_SIZE_MIN);

        try {
            const b = bulletPool.fireCharged(this.x, this.y, this.rotation, damage, size);
            if (b) {
                this.scene.audio.play('charge_shoot');
                if (pct >= 0.5) this.scene.cameras.main.shake(150, 0.008 + pct * 0.017);
            }
        } catch (e) {
            console.warn('Player.useChargeMeter error:', e);
        }

        this._chargeMeter = 0;
        this.scene.events.emit('chargeChanged', 0);
    }

    _fireNormal(bulletPool, time) {
        try {
            bulletPool.fire(this.x, this.y, this.rotation);
            this.scene.audio.play('shoot');
        } catch (e) {
            console.warn('Player._fireNormal error:', e);
        }
        this.lastShot = time;
    }

    shoot(bulletPool, time) {
        this._fireNormal(bulletPool, time);
    }

    takeDamage(amount) {
        if (this.invincible || !this.active) return;

        this.hp = Math.max(0, this.hp - amount);
        this.scene.events.emit('healthChanged', this.hp, this.maxHp);
        this.scene.audio.play('player_hit');
        this.scene.cameras.main.shake(160, 0.012);

        this.setTint(0xff4444);
        this.invincible = true;

        this.scene.time.delayedCall(200, () => { if (this.active) this.clearTint(); });
        this.scene.time.delayedCall(CONSTANTS.PLAYER_IFRAMES, () => {
            this.invincible = false;
        });

        if (this.hp <= 0) {
            this.scene.events.emit('playerDied');
        }
    }
}
