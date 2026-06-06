class EnemyBase extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, textureKey) {
        super(scene, x, y, textureKey || 'enemy_drone', 0);
        this.hp      = 20;
        this.maxHp   = 20;
        this.speed   = 80;
        this.scoreValue  = 10;
        this.contactDamage = 1;
        this._textureKey = textureKey || 'enemy_drone';
    }

    spawn(x, y) {
        this.setActive(true).setVisible(true);
        this.setPosition(x, y);
        if (this.body) this.body.reset(x, y);
        this.hp = this.maxHp;
        this.clearTint();
        this.setRotation(0);
        this.setDepth(10 + y / 1000);
        try { this.play(this._textureKey, true); } catch(e) {}
    }

    preUpdate(time, delta) {
        if (!this.active) return;
        super.preUpdate(time, delta);

        const player = this.scene.player;
        if (!player || !player.active) return;

        this._move(player, time, delta);
        this._act(time, delta);
        this.setDepth(10 + this.y / 1000);
    }

    _move(player, time, delta) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle), this.speed, this.body.velocity
        );
        this.setRotation(angle);
    }

    _act(time, delta) {}

    takeDamage(amount) {
        if (!this.active) return;
        this.hp -= amount;

        this.setTint(0xffffff);
        this.scene.time.delayedCall(80, () => {
            if (this.active) this.clearTint();
        });

        if (this.hp <= 0) this.die();
    }

    die() {
        if (!this.active) return;
        this.setActive(false).setVisible(false);
        if (this.body) this.body.stop();

        this.scene.audio.play('enemy_die');
        this.scene.spawnDeathEffect(this.x, this.y);
        this.scene.onEnemyKilled(this.scoreValue);
    }
}
