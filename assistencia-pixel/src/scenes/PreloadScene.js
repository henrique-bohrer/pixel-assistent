import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Build a visual loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();

        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 100, height / 2 - 15, 200, 30);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 30,
            text: 'Carregando...',
            style: {
                font: '14px monospace',
                fill: '#ffffff'
            }
        }).setOrigin(0.5);

        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width / 2 - 95, height / 2 - 10, 190 * value, 20);
        });

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Simulating asset loading (since we are using programmatic shapes right now)
        // If we had images, we'd do this.load.image('logo', 'assets/sprites/logo.png');
        for (let i = 0; i < 50; i++) {
            // Fake delay for demonstration purposes
            this.load.image('fake_asset_' + i, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
        }
    }

    create() {
        this.scene.start('MenuScene');
    }
}
