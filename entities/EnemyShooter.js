class EnemyShooter extends EnemyBase {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_shooter');
        this.hp         = 20;
        this.maxHp      = 20;
        this.speed      = 62;
        this.scoreValue = 25;
        this.contactDamage = 1;
        this._textureKey = 'enemy_shooter';
        this._lastShot   = 0;
        this._shootCooldown = 1800;
        this._strafeDir  = 1;
        this._strafeTimer = 0;
    }

    spawn(x, y) {
        super.spawn(x, y);
        this._lastShot = this.scene.time.now;
        this._strafeDir = Math.random() < 0.5 ? 1 : -1;
        this._strafeTimer = 0;
    }

    _move(player, time, delta) {
        if (this._dodging) return;
        const dist  = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        if (dist > 200) {
            this.scene.physics.velocityFromAngle(
                Phaser.Math.RadToDeg(angle), this.speed, this.body.velocity
            );
        } else {
            this._strafeTimer += delta;
            if (this._strafeTimer > 1600) {
                this._strafeDir  *= -1;
                this._strafeTimer = 0;
            }
            const strafeAngle = angle + (Math.PI / 2) * this._strafeDir;
            this.scene.physics.velocityFromAngle(
                Phaser.Math.RadToDeg(strafeAngle), this.speed * 0.85, this.body.velocity
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
