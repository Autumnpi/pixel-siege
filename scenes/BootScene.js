class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'Boot' }); }

    create() {
        // Generate all sprite textures from pixel art data
        SpriteFactory.generateAll(this);

        // Create and store the audio manager
        const audio = new AudioManager();
        audio.init();
        this.registry.set('audio', audio);

        this.scene.start('Menu');
    }
}
