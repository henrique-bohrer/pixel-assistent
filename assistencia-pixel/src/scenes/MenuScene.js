import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Background
        this.cameras.main.setBackgroundColor('#1a1a24');

        // Title
        this.add.text(width / 2, height / 3, 'ASSISTÊNCIA PIXEL', {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#4CAF50',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 3 + 25, 'Console de Reparos', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#888'
        }).setOrigin(0.5);

        // "Abrir Oficina" Button
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x333333, 1);
        btnBg.lineStyle(2, 0x4CAF50, 1);

        const btnW = 120;
        const btnH = 30;
        const btnX = width / 2 - btnW / 2;
        const btnY = height / 2 + 20;

        btnBg.fillRect(btnX, btnY, btnW, btnH);
        btnBg.strokeRect(btnX, btnY, btnW, btnH);

        const btnText = this.add.text(width / 2, btnY + btnH / 2, 'ABRIR OFICINA', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Interactive Area
        const hitArea = this.add.zone(width / 2, btnY + btnH / 2, btnW, btnH).setInteractive();
        hitArea.on('pointerdown', () => {
            btnBg.fillStyle(0x4CAF50, 1);
            btnBg.fillRect(btnX, btnY, btnW, btnH);
            btnText.setFill('#000');

            this.cameras.main.fadeOut(300, 0, 0, 0);
        });

        hitArea.on('pointerover', () => {
            document.body.style.cursor = 'pointer';
            btnBg.clear();
            btnBg.fillStyle(0x444444, 1);
            btnBg.lineStyle(2, 0x66ff66, 1);
            btnBg.fillRect(btnX, btnY, btnW, btnH);
            btnBg.strokeRect(btnX, btnY, btnW, btnH);
        });

        hitArea.on('pointerout', () => {
            document.body.style.cursor = 'default';
            btnBg.clear();
            btnBg.fillStyle(0x333333, 1);
            btnBg.lineStyle(2, 0x4CAF50, 1);
            btnBg.fillRect(btnX, btnY, btnW, btnH);
            btnBg.strokeRect(btnX, btnY, btnW, btnH);
        });

        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            document.body.style.cursor = 'default';
            this.scene.start('WorkshopScene');
        });
    }
}
