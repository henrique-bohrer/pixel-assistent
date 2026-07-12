import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';

export class DiagnosisScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DiagnosisScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.clientData = this.registry.get('currentClient');
        this.progressionManager = this.registry.get('progressionManager');

        this.uiManager = new UIManager(this, this.progressionManager);

        // Background
        this.add.rectangle(0, 0, width, height, 0x223322).setOrigin(0, 0);
        this.add.text(width / 2, 40, 'Diagnóstico', { fontFamily: 'monospace', fontSize: '16px', fill: '#fff' }).setOrigin(0.5);

        // Phone Sprite
        this.phoneSprite = this.add.image(width / 2, height / 2 + 20, this.clientData.model.sprite).setScale(1.2);

        // Client Symptom Balloon
        this.createSymptomBalloon();

        // State machine for minigames
        this.state = 'opening'; // opening -> diagnosis -> ready
        this.screwsLeft = this.clientData.model.screwCount || 4;

        this.startOpeningMinigame();

        this.uiManager.fadeIn(200);
    }

    createSymptomBalloon() {
        const balloonBg = this.add.rectangle(this.cameras.main.width / 2, 70, 200, 40, 0xffffff).setOrigin(0.5);
        balloonBg.setStrokeStyle(1, 0x000000);

        this.add.text(this.cameras.main.width / 2, 70, this.clientData.defect.symptom, {
            fontFamily: 'monospace',
            fontSize: '9px',
            fill: '#000',
            align: 'center',
            wordWrap: { width: 190 }
        }).setOrigin(0.5);
    }

    startOpeningMinigame() {
        this.screws = this.add.group();
        const positions = [
            { x: -20, y: -40 }, { x: 20, y: -40 },
            { x: -20, y: 40 }, { x: 20, y: 40 },
            { x: 0, y: -40 }, { x: 0, y: 40 },
            { x: -20, y: 0 }, { x: 20, y: 0 }
        ];

        for (let i = 0; i < this.screwsLeft; i++) {
            const pos = positions[i % positions.length];
            const screw = this.add.image(this.cameras.main.width / 2 + pos.x, this.cameras.main.height / 2 + 20 + pos.y, 'screw').setInteractive({ useHandCursor: true });

            screw.clicksNeeded = 3;
            screw.on('pointerdown', () => {
                screw.clicksNeeded--;
                // Visual feedback (rotate or scale)
                this.tweens.add({ targets: screw, angle: '+=90', duration: 100 });

                if (screw.clicksNeeded <= 0) {
                    screw.destroy();
                    this.screwsLeft--;
                    this.uiManager.showToast('Parafuso removido');
                    if (this.screwsLeft <= 0) {
                        this.startMultimeterMinigame();
                    }
                }
            });
            this.screws.add(screw);
        }
    }

    startMultimeterMinigame() {
        this.state = 'diagnosis';
        this.uiManager.showToast('Telefone aberto. Use o multímetro!');

        // Change phone to open state (just tint for now or show internal texture)
        this.phoneSprite.setTint(0xaaaaaa);

        // Multimeter probes
        this.probe1 = this.add.rectangle(this.cameras.main.width / 2 - 50, this.cameras.main.height - 20, 5, 40, 0xff0000).setInteractive({ draggable: true });
        this.probe2 = this.add.rectangle(this.cameras.main.width / 2 + 50, this.cameras.main.height - 20, 5, 40, 0x000000).setInteractive({ draggable: true });

        // Test points
        this.targetPoint1 = this.add.rectangle(this.cameras.main.width / 2 - 10, this.cameras.main.height / 2, 10, 10, 0xdddd00).setAlpha(0.5);
        this.targetPoint2 = this.add.rectangle(this.cameras.main.width / 2 + 10, this.cameras.main.height / 2 + 20, 10, 10, 0xdddd00).setAlpha(0.5);

        this.input.setDraggable(this.probe1);
        this.input.setDraggable(this.probe2);

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
            this.checkMultimeter();
        });
    }

    checkMultimeter() {
        const dist1 = Phaser.Math.Distance.Between(this.probe1.x, this.probe1.y, this.targetPoint1.x, this.targetPoint1.y);
        const dist2 = Phaser.Math.Distance.Between(this.probe2.x, this.probe2.y, this.targetPoint2.x, this.targetPoint2.y);

        // Also check swapped
        const dist3 = Phaser.Math.Distance.Between(this.probe1.x, this.probe1.y, this.targetPoint2.x, this.targetPoint2.y);
        const dist4 = Phaser.Math.Distance.Between(this.probe2.x, this.probe2.y, this.targetPoint1.x, this.targetPoint1.y);

        if ((dist1 < 15 && dist2 < 15) || (dist3 < 15 && dist4 < 15)) {
            if (this.state !== 'ready') {
                this.state = 'ready';
                this.uiManager.showToast(`Defeito encontrado: ${this.clientData.defect.name}`);
                this.showRepairButton();
            }
        }
    }

    showRepairButton() {
        const btnBg = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height - 30, 100, 30, 0x00aa00).setInteractive({ useHandCursor: true });
        btnBg.setStrokeStyle(1, 0xffffff);
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 30, 'Iniciar Reparo', { fontFamily: 'monospace', fontSize: '12px', fill: '#fff' }).setOrigin(0.5);

        btnBg.on('pointerdown', () => {
            this.uiManager.fadeOut(200, () => {
                this.scene.start('RepairScene');
            });
        });
    }
}
