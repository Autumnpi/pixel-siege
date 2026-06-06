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

        // Charge state
        this._chargeStart = 0;
        this._charging = false;
        this._chargeLastFired = -9999;
        this._chargeReadyPlayed = false;
        this._pointerWasDown = false;

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
        const isDown = pointer.isDown;

        if (isDown) {
            if (this._chargeStart === 0) {
                this._chargeStart = time;
                this._chargeReadyPlayed = false;
            }
            const held = time - this._chargeStart;

            if (held < CONSTANTS.CHARGE_MIN_HOLD) {
                // Normal auto-fire while tapping/short press
                if (time > this.lastShot + CONSTANTS.BULLET_COOLDOWN) {
                    this._fireNormal(bulletPool, time);
                }
                this._charging = false;
                this.scene.events.emit('chargeChanged', 0);
            } else {
                // Charging — stop normal fire, show charge meter
                this._charging = true;
                const pct = Math.min(
                    (held - CONSTANTS.CHARGE_MIN_HOLD) / (CONSTANTS.CHARGE_MAX_HOLD - CONSTANTS.CHARGE_MIN_HOLD),
                    1
                );
                this.scene.events.emit('chargeChanged', pct);
                if (pct >= 1 && !this._chargeReadyPlayed) {
                    this._chargeReadyPlayed = true;
                    this.scene.audio.play('charge_ready');
                }
            }
        } else {
            // Pointer just released
            if (this._pointerWasDown && this._charging) {
                if (time > this._chargeLastFired + CONSTANTS.CHARGE_COOLDOWN) {
                    this._fireCharged(bulletPool, time);
                    this._chargeLastFired = time;
                }
            }
            this._charging = false;
            this._chargeStart = 0;
            this._chargeReadyPlayed = false;
            this.scene.events.emit('chargeChanged', 0);
        }

        this._pointerWasDown = isDown;
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

    _fireCharged(bulletPool, time) {
        try {
            bulletPool.fireCharged(this.x, this.y, this.rotation);
            this.scene.audio.play('charge_shoot');
            this.scene.cameras.main.shake(120, 0.018);
        } catch (e) {
            console.warn('Player._fireCharged error:', e);
        }
        this.lastShot = time;
    }

    // kept for external callers
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
