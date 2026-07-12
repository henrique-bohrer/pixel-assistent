import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';

export class DiagnosisScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DiagnosisScene' });
    }

    init(data) {
        this.client = data.client;
    }

    create() {
        this.cameras.main.fadeIn(200, 0, 0, 0);
        this.cameras.main.setBackgroundColor('#2c3e50');

        this.ui = new UIManager(this);
        this.ui.createHUD();

        const width = this.scale.width;
        const height = this.scale.height;

        // Title
        this.add.text(width / 2, 40, 'Mesa de Diagnóstico', {
            fontFamily: 'monospace', fontSize: '14px', fill: '#fff'
        }).setOrigin(0.5);

        // Phone placeholder
        const phone = this.add.graphics();
        phone.fillStyle(0x555555, 1);
        phone.fillRoundedRect(width / 2 - 40, height / 2 - 60, 80, 120, 8);
        phone.lineStyle(2, 0x333333);
        phone.strokeRoundedRect(width / 2 - 40, height / 2 - 60, 80, 120, 8);

        this.add.text(width / 2, height / 2 - 40, this.client.model.name, {
            fontFamily: 'monospace', fontSize: '10px', fill: '#ccc'
        }).setOrigin(0.5);

        // Client dialog bubble
        const bubble = this.add.graphics();
        bubble.fillStyle(0xffffff, 1);
        bubble.fillRoundedRect(20, 60, 120, 80, 8);

        this.add.text(25, 65, `Cliente diz:\n\n"${this.client.defect.symptom}"`, {
            fontFamily: 'monospace', fontSize: '10px', fill: '#000', wordWrap: { width: 110 }
        });

        // Diagnose Action Buttons
        this.createDiagnosticSteps(width, height);

        // Back button
        const backBtn = this.add.text(10, height - 20, '< Voltar Oficina', {
            fontFamily: 'monospace', fontSize: '12px', fill: '#e74c3c'
        }).setInteractive({ cursor: 'pointer' });

        backBtn.on('pointerdown', () => {
            this.ui.fadeTransition('WorkshopScene');
        });
    }

    createDiagnosticSteps(width, height) {
        this.stepsCompleted = 0;

        const step1Btn = this.add.graphics();
        step1Btn.fillStyle(0x3498db, 1);
        step1Btn.fillRect(width - 120, 80, 100, 30);

        const step1Text = this.add.text(width - 70, 95, 'Abrir Parafusos', {
            fontFamily: 'monospace', fontSize: '10px', fill: '#fff'
        }).setOrigin(0.5);

        const step1Zone = this.add.zone(width - 70, 95, 100, 30).setInteractive({ cursor: 'pointer' });

        step1Zone.on('pointerdown', () => {
            step1Btn.fillStyle(0x2ecc71, 1);
            step1Btn.fillRect(width - 120, 80, 100, 30);
            step1Text.setText('Aberto!');
            step1Zone.disableInteractive();
            this.ui.showToast("Aparelho aberto.", 0x3498db);
            this.checkProgress(width, height);
        });

        const step2Btn = this.add.graphics();
        step2Btn.fillStyle(0x9b59b6, 1);
        step2Btn.fillRect(width - 120, 120, 100, 30);

        const step2Text = this.add.text(width - 70, 135, 'Usar Multímetro', {
            fontFamily: 'monospace', fontSize: '10px', fill: '#fff'
        }).setOrigin(0.5);

        const step2Zone = this.add.zone(width - 70, 135, 100, 30).setInteractive({ cursor: 'pointer' });

        step2Zone.on('pointerdown', () => {
            step2Btn.fillStyle(0x2ecc71, 1);
            step2Btn.fillRect(width - 120, 120, 100, 30);
            step2Text.setText('Defeito achado');
            step2Zone.disableInteractive();
            this.ui.showToast(`Diagnóstico: ${this.client.defect.name}`, 0x9b59b6);
            this.checkProgress(width, height);
        });
    }

    checkProgress(width, height) {
        this.stepsCompleted++;
        if (this.stepsCompleted === 2) {
            // Show Finish Diagnosis Button
            const finBtn = this.add.graphics();
            finBtn.fillStyle(0xe67e22, 1);
            finBtn.fillRect(width / 2 - 60, height - 40, 120, 30);

            this.add.text(width / 2, height - 25, 'Confirmar Defeito', {
                fontFamily: 'monospace', fontSize: '10px', fill: '#fff', fontStyle: 'bold'
            }).setOrigin(0.5);

            const finZone = this.add.zone(width / 2, height - 25, 120, 30).setInteractive({ cursor: 'pointer' });
            finZone.on('pointerdown', () => {
                this.ui.fadeTransition('WorkshopScene');
            });
        }
    }
}
