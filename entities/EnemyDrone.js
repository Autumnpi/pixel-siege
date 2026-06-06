class EnemyDrone extends EnemyBase {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_drone');
        this.hp         = 20;
        this.maxHp      = 20;
        this.speed      = 95;
        this.scoreValue = 10;
        this.contactDamage = 1;
        this._textureKey = 'enemy_drone';
    }
}
