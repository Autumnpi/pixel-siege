class EnemyShooter extends EnemyBase {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_shooter');
        this.hp         = 40;
        this.maxHp      = 40;
        this.speed      = 58;
        this.scoreValue = 25;
        this.contactDamage = 1;
        this._textureKey = 'enemy_shooter';
        this._lastShot = 0;
        this._shootCooldown = 2200;
        this._strafeDir = 1;
        this._strafeTimer = 0;
    }

    spawn(x, y) {
        super.spawn(x, y);
        this._lastShot = this.scene.time.now; // delay first shot
        this._strafeDir = Math.random() < 0.5 ? 1 : -1;
        this._strafeTimer = 0;
    }

    _move(player, time, delta) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        if (dist > 220) {
            // Approach
            this.scene.physics.velocityFromAngle(
                Phaser.Math.RadToDeg(angle), this.speed, this.body.velocity
            );
        } else {
            // Strafe horizontally relative to player
            this._strafeTimer += delta;
            if (this._strafeTimer > 1800) {
                this._strafeDir *= -1;
                this._strafeTimer = 0;
            }
            const strafeAngle = angle + (Math.PI / 2) * this._strafeDir;
            this.scene.physics.velocityFromAngle(
                Phaser.Math.RadToDeg(strafeAngle), this.speed * 0.8, this.body.velocity
            );
        }
        this.setRotation(angle);
    }

    _act(time, delta) {
        if (time - this._lastShot > this._shootCooldown) {
            this._lastShot = time;
            const player = this.scene.player;
            if (player && player.active) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                this.scene.enemyBulletPool.fire(this.x, this.y, angle);
                this.scene.audio.play('enemy_shoot');
            }
        }
    }
}
