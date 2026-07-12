import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Loading UI
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width / 2, height / 2 - 50, 'boot_logo').setOrigin(0.5);

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 100, height / 2 + 10, 200, 20);

        // Pixel art style outline
        progressBox.lineStyle(1, 0xffffff, 1);
        progressBox.strokeRect(width / 2 - 100, height / 2 + 10, 200, 20);

        const loadingText = this.add.text(width / 2, height / 2, 'Carregando...', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width / 2 - 98, height / 2 + 12, 196 * value, 16);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Load JSON data
        this.load.json('models', 'src/data/models.json');
        this.load.json('defects', 'src/data/defects.json');
        this.load.json('parts', 'src/data/parts.json');
        this.load.json('tools', 'src/data/tools.json');

        // Placeholder generation for sprites
        this.createPlaceholderTextures();
    }

    createPlaceholderTextures() {
        // Phone models
        this.generateRectTexture('phone_retro', 60, 120, 0x555555);
        this.generateRectTexture('phone_modern', 64, 130, 0x111111);
        this.generateRectTexture('phone_geek', 68, 140, 0x220033);

        // Parts
        this.generateRectTexture('screen_generic', 56, 116, 0x000000);
        this.generateRectTexture('screen_oled', 64, 136, 0x001122);
        this.generateRectTexture('battery_generic', 40, 60, 0x00aa00);
        this.generateRectTexture('ic_chip', 16, 16, 0x222222);

        // Tools
        this.generateRectTexture('screwdriver_basic', 8, 40, 0xaaaaaa);
        this.generateRectTexture('multimeter_basic', 30, 50, 0xddaa00);
        this.generateRectTexture('soldering_iron', 10, 50, 0xdd2222);
        this.generateRectTexture('brush_anti_static', 12, 40, 0x333333);

        // UI Elements
        this.generateRectTexture('screw', 4, 4, 0xcccccc);
        this.generateRectTexture('client_icon', 24, 24, 0xffaacc);
        this.generateRectTexture('workbench', 384, 100, 0x5c4033); // Brown table
    }

    generateRectTexture(key, width, height, color) {
        let graphics = this.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, width, height);
        // outline
        graphics.lineStyle(1, 0xffffff, 1);
        graphics.strokeRect(0, 0, width, height);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    create() {
        this.scene.start('MenuScene');
    }
}
