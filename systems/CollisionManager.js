const CollisionManager = {
    setup(scene) {
        const p   = scene.player;
        const bp  = scene.bulletPool.group;
        const ebp = scene.enemyBulletPool.group;
        const dg  = scene.droneGroup;
        const tg  = scene.tankGroup;
        const sg  = scene.shooterGroup;
        const bg  = scene.bossGroup;

        // Player bullets hit enemies (use bullet's own damage value)
        [dg, tg, sg, bg].forEach(group => {
            scene.physics.add.overlap(bp, group, (bullet, enemy) => {
                if (!bullet.active || !enemy.active) return;
                const dmg = bullet.damage || CONSTANTS.BULLET_DAMAGE;
                bullet.setActive(false).setVisible(false);
                bullet.setScale(1);
                bullet.clearTint();
                enemy.takeDamage(dmg);
            });
        });

        // Enemies collide with player (contact damage)
        [dg, tg, sg, bg].forEach(group => {
            scene.physics.add.overlap(p, group, (player, enemy) => {
                if (!enemy.active || !player.active) return;
                player.takeDamage(enemy.contactDamage);
            });
        });

        // Enemy bullets hit player
        scene.physics.add.overlap(p, ebp, (player, bullet) => {
            if (!bullet.active || !player.active) return;
            bullet.setActive(false).setVisible(false);
            player.takeDamage(CONSTANTS.ENEMY_BULLET_DAMAGE);
        });

        // Wall collisions (player + all enemies)
        if (scene.wallGroup) {
            scene.physics.add.collider(p, scene.wallGroup);
            [dg, tg, sg, bg].forEach(group => {
                scene.physics.add.collider(group, scene.wallGroup);
            });
        }
    },
};
