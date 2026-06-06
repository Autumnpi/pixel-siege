const CollisionManager = {
    setup(scene) {
        const p   = scene.player;
        const bp  = scene.bulletPool.group;
        const ebp = scene.enemyBulletPool.group;
        const dg  = scene.droneGroup;
        const tg  = scene.tankGroup;
        const sg  = scene.shooterGroup;
        const bg  = scene.bossGroup;

        // Player bullets hit enemies
        [dg, tg, sg, bg].forEach(group => {
            scene.physics.add.overlap(bp, group, (bullet, enemy) => {
                if (!bullet.active || !enemy.active) return;
                bullet.setActive(false).setVisible(false);
                enemy.takeDamage(CONSTANTS.BULLET_DAMAGE);
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
    },
};
