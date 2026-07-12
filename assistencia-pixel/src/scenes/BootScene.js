import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Here we would load essential assets like the company logo or loading bar graphics.
        // For now, we'll keep it empty since we're using procedural graphics.
    }

    create() {
        this.scene.start('PreloadScene');
    }
}
