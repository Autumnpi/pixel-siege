class EnemyDrone extends EnemyBase {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_drone');
        this.hp         = 10;
        this.maxHp      = 10;
        this.speed      = 105;
        this.scoreValue = 10;
        this.contactDamage = 1;
        this._textureKey = 'enemy_drone';
        this._zigzagTimer = 0;
        this._zigzagDir   = 1;
        this._zigzagInterval = 480;
    }

    spawn(x, y) {
        super.spawn(x, y);
        this._zigzagTimer = 0;
        this._zigzagDir   = Math.random() < 0.5 ? 1 : -1;
        this._zigzagInterval = 400 + Math.random() * 200;
    }

    _move(player, time, delta) {
        if (this._dodging) return;

        this._zigzagTimer += delta;
        if (this._zigzagTimer >= this._zigzagInterval) {
            this._zigzagTimer = 0;
            this._zigzagDir *= -1;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const perp  = angle + Math.PI / 2;
        const fwd   = 0.65, side = 0.35;

        this.setVelocity(
            Math.cos(angle) * this.speed * fwd + Math.cos(perp) * this.speed * side * this._zigzagDir,
            Math.sin(angle) * this.speed * fwd + Math.sin(perp) * this.speed * side * this._zigzagDir
        );
        this.setRotation(angle);
    }
}
