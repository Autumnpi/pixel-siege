const config = {
    type: Phaser.AUTO,
    width:  800,
    height: 600,
    backgroundColor: '#080818',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
        },
    },
    scene: [BootScene, MenuScene, GameScene, HUDScene, LevelCompleteScene, GameOverScene],
};

window.game = new Phaser.Game(config);
