import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0, 0);

        // Title
        this.add.text(width / 2, height / 3, 'Assistência Pixel', {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#00ffcc',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 3 + 20, 'O Rei do Conserto', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // Button Background
        const btnWidth = 120;
        const btnHeight = 30;
        const btnBg = this.add.rectangle(width / 2, height / 1.5, btnWidth, btnHeight, 0x333333);
        btnBg.setStrokeStyle(1, 0xffffff);
        btnBg.setInteractive({ useHandCursor: true });

        // Button Text
        const btnText = this.add.text(width / 2, height / 1.5, 'Abrir Oficina', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Hover effects
        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0x555555);
        });

        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x333333);
        });

        // Click effect & Scene Transition
        btnBg.on('pointerdown', () => {
            btnBg.setFillStyle(0x222222);
            this.cameras.main.fadeOut(200, 0, 0, 0);
        });

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('WorkshopScene');
        });

        // Fade in on start
        this.cameras.main.fadeIn(200, 0, 0, 0);
    }
}
