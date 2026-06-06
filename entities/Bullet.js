class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
        this._born    = 0;
        this._lifespan = CONSTANTS.BULLET_LIFESPAN;
        this.damage   = CONSTANTS.BULLET_DAMAGE;
    }

    fire(x, y, angle, speed, lifespan, damage, scale) {
        this.setActive(true).setVisible(true);
        this.setPosition(x, y);
        if (!this.body) { this.setActive(false); return; }
        this.body.reset(x, y);
        this.setRotation(angle);
        this.setScale(scale || 1);
        this._born    = 0;
        this._lifespan = lifespan || CONSTANTS.BULLET_LIFESPAN;
        this.damage   = damage   || CONSTANTS.BULLET_DAMAGE;
        this.scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle), speed || CONSTANTS.BULLET_SPEED,
            this.body.velocity
        );
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.active) return;
        this._born += delta;
        if (this._born > this._lifespan) {
            this.setActive(false).setVisible(false);
            this.setScale(1);
            this.clearTint();
        }
    }
}

class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_bullet');
        this._born = 0;
    }

    fire(x, y, angle) {
        this.setActive(true).setVisible(true);
        this.setPosition(x, y);
        if (!this.body) { this.setActive(false); return; }
        this.body.reset(x, y);
        this.setRotation(angle);
        this._born = 0;
        this.scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle), CONSTANTS.ENEMY_BULLET_SPEED,
            this.body.velocity
        );
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.active) return;
        this._born += delta;
        if (this._born > CONSTANTS.ENEMY_BULLET_LIFESPAN) {
            this.setActive(false).setVisible(false);
        }
    }
}

class BulletPool {
    constructor(scene) {
        this.group = scene.physics.add.group({
            classType: Bullet,
            maxSize: 80,
            runChildUpdate: true,
            defaultKey: 'bullet',
        });
    }

    fire(x, y, angle) {
        try {
            const b = this.group.get();
            if (!b) return null;
            b.setTexture('bullet');
            b.clearTint();
            b.fire(x, y, angle);
            b.setDepth(20);
            return b;
        } catch (e) {
            console.warn('BulletPool.fire error:', e);
            return null;
        }
    }

    // damage and size are determined by charge level — passed from Player.useChargeMeter
    fireCharged(x, y, angle, damage, size) {
        try {
            const b = this.group.get();
            if (!b) return null;
            b.setTexture('bullet');
            b.fire(x, y, angle, CONSTANTS.CHARGE_SPEED, CONSTANTS.BULLET_LIFESPAN, damage, size);
            // Tint reflects charge power: green → yellow → cyan
            const pct = (damage - CONSTANTS.CHARGE_DAMAGE_MIN) /
                        (CONSTANTS.CHARGE_DAMAGE_MAX - CONSTANTS.CHARGE_DAMAGE_MIN);
            b.setTint(pct >= 0.8 ? 0x00ffff : pct >= 0.4 ? 0xffcc00 : 0x44ff88);
            b.setDepth(20);
            return b;
        } catch (e) {
            console.warn('BulletPool.fireCharged error:', e);
            return null;
        }
    }
}

class EnemyBulletPool {
    constructor(scene) {
        this.group = scene.physics.add.group({
            classType: EnemyBullet,
            maxSize: 120,
            runChildUpdate: true,
            defaultKey: 'enemy_bullet',
        });
    }

    fire(x, y, angle) {
        try {
            const b = this.group.get();
            if (!b) return null;
            b.setTexture('enemy_bullet');
            b.fire(x, y, angle);
            b.setDepth(21);
            return b;
        } catch (e) {
            console.warn('EnemyBulletPool.fire error:', e);
            return null;
        }
    }
}
