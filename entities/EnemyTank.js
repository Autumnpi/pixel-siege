class EnemyTank extends EnemyBase {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_tank');
        this.hp         = 45;
        this.maxHp      = 45;
        this.speed      = 42;
        this.scoreValue = 30;
        this.contactDamage = 2;
        this._textureKey = 'enemy_tank';
        this._hasDodge   = false;
        this._charging   = false;
        this._chargeTimer = 0;
        this._chargeInterval = 5000;
    }

    spawn(x, y) {
        super.spawn(x, y);
        this._charging = false;
        this._chargeTimer = 0;
        this._chargeInterval = 4500 + Math.random() * 3000;
    }

    _move(player, time, delta) {
        if (this._charging) return;

        this._chargeTimer += delta;
        if (this._chargeTimer >= this._chargeInterval) {
            this._chargeTimer = 0;
            this._chargeInterval = 4500 + Math.random() * 3000;
            this._startCharge(player);
            return;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle), this.speed, this.body.velocity
        );
        this.setRotation(angle);
    }

    _startCharge(player) {
        if (!player || !player.active) return;
        this._charging = true;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle), this.speed * 4.5, this.body.velocity
        );
        this.setTint(0xff6600);

        this.scene.time.delayedCall(520, () => {
            if (this.active) {
                this.clearTint();
                this._charging = false;
                if (this.body) this.body.stop();
            }
        });
    }

    takeDamage(amount) {
        if (!this.active) return;
        const ox = this.x, oy = this.y;
        this.scene.tweens.add({
            targets: this,
            x: ox + Phaser.Math.Between(-3, 3),
            y: oy + Phaser.Math.Between(-3, 3),
            duration: 40,
            yoyo: true,
            onComplete: () => { if (this.active) { this.x = ox; this.y = oy; } }
        });
        super.takeDamage(amount);
    }
}
