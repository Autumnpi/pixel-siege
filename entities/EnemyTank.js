class EnemyTank extends EnemyBase {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_tank');
        this.hp         = 80;
        this.maxHp      = 80;
        this.speed      = 42;
        this.scoreValue = 30;
        this.contactDamage = 2;
        this._textureKey = 'enemy_tank';
    }

    takeDamage(amount) {
        if (!this.active) return;
        // Brief shake effect on hit
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
