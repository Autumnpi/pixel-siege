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
        this._invTimer = null;

        this.play('player');
    }

    update(cursors, wasd, pointer, bulletPool, time) {
        this._handleMovement(cursors, wasd);
        this._handleAim(pointer);

        if (pointer.isDown && time > this.lastShot + CONSTANTS.BULLET_COOLDOWN) {
            this.shoot(bulletPool, time);
        }
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

    shoot(bulletPool, time) {
        bulletPool.fire(this.x, this.y, this.rotation);
        this.scene.audio.play('shoot');
        this.lastShot = time;
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
