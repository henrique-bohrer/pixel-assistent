import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load only what is necessary for the Preload scene (e.g., logo or background for loading bar)
        // We will generate a simple graphic for the logo just to have something
        let graphics = this.add.graphics();
        graphics.fillStyle(0x444444, 1);
        graphics.fillRect(0, 0, 100, 100);
        graphics.generateTexture('boot_logo', 100, 100);
        graphics.destroy();
    }

    create() {
        this.scene.start('PreloadScene');
    }
}
