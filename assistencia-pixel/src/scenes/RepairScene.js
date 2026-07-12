import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { dataManager } from '../systems/DataManager';

export class RepairScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RepairScene' });
    }

    init(data) {
        this.client = data.client;
    }

    create() {
        this.cameras.main.fadeIn(200, 0, 0, 0);
        this.cameras.main.setBackgroundColor('#273c75');

        this.ui = new UIManager(this);
        this.ui.createHUD();

        const width = this.scale.width;
        const height = this.scale.height;

        this.add.text(width / 2, 40, 'Mesa de Reparo', {
            fontFamily: 'monospace', fontSize: '14px', fill: '#fff'
        }).setOrigin(0.5);

        // Display Required Part
        const partId = this.client.defect.required_part;
        const partData = dataManager.parts.find(p => p.id === partId);

        this.add.text(width / 2, 60, `Defeito: ${this.client.defect.name}\nPeça necessária: ${partData.name}`, {
            fontFamily: 'monospace', fontSize: '10px', fill: '#f1c40f', align: 'center'
        }).setOrigin(0.5);

        // Check Inventory
        const hasPart = dataManager.playerState.inventory[partId] > 0;

        if (hasPart) {
            this.add.text(width / 2, 85, `Em estoque: ${dataManager.playerState.inventory[partId]}`, {
                fontFamily: 'monospace', fontSize: '10px', fill: '#2ecc71'
            }).setOrigin(0.5);

            this.createMinigameSimulation(width, height, partId);
        } else {
            this.add.text(width / 2, 85, `Estoque Vazio! Custa ${partData.cost} moedas.`, {
                fontFamily: 'monospace', fontSize: '10px', fill: '#e74c3c'
            }).setOrigin(0.5);

            // Buy button
            const buyBtn = this.add.graphics();
            buyBtn.fillStyle(0x3498db, 1);
            buyBtn.fillRect(width / 2 - 50, 100, 100, 30);

            const buyText = this.add.text(width / 2, 115, 'Comprar Peça', {
                fontFamily: 'monospace', fontSize: '10px', fill: '#fff'
            }).setOrigin(0.5);

            const buyZone = this.add.zone(width / 2, 115, 100, 30).setInteractive({ cursor: 'pointer' });

            buyZone.on('pointerdown', () => {
                if (dataManager.playerState.coins >= partData.cost) {
                    dataManager.addCoins(-partData.cost);
                    dataManager.playerState.inventory[partId]++;
                    this.ui.updateHUD();
                    this.ui.showToast("Peça comprada!", 0x2ecc71);

                    // Re-render scene elements basically
                    buyBtn.destroy();
                    buyText.destroy();
                    buyZone.destroy();
                    this.createMinigameSimulation(width, height, partId);
                } else {
                    this.ui.showToast("Moedas insuficientes!", 0xe74c3c);
                }
            });
        }

        // Back button
        const backBtn = this.add.text(10, height - 20, '< Voltar Oficina', {
            fontFamily: 'monospace', fontSize: '12px', fill: '#e74c3c'
        }).setInteractive({ cursor: 'pointer' });

        backBtn.on('pointerdown', () => {
            this.ui.fadeTransition('WorkshopScene');
        });
    }

    createMinigameSimulation(width, height, partId) {
        // Minigame Placeholder
        const mgBox = this.add.graphics();
        mgBox.fillStyle(0x34495e, 1);
        mgBox.fillRoundedRect(width / 2 - 80, 110, 160, 60, 4);

        const mgText = this.add.text(width / 2, 130, `Simulando Minigame:\n[ ${this.client.defect.minigame} ]`, {
            fontFamily: 'monospace', fontSize: '10px', fill: '#ecf0f1', align: 'center'
        }).setOrigin(0.5);

        const repairBtn = this.add.graphics();
        repairBtn.fillStyle(0x2ecc71, 1);
        repairBtn.fillRect(width / 2 - 50, 150, 100, 25);

        const repairText = this.add.text(width / 2, 162.5, 'Executar Reparo', {
            fontFamily: 'monospace', fontSize: '10px', fill: '#000', fontStyle: 'bold'
        }).setOrigin(0.5);

        const repairZone = this.add.zone(width / 2, 162.5, 100, 25).setInteractive({ cursor: 'pointer' });

        repairZone.on('pointerdown', () => {
            // Consume part
            dataManager.playerState.inventory[partId]--;
            dataManager.saveProgress();

            this.ui.showToast("Reparo concluído com sucesso!", 0x2ecc71);

            // In a real app we'd access the kanban in WorkshopScene via registry or events
            // For this prototype, we'll just flag the client object, and when WorkshopScene loads
            // we move it from inProgress to done if this flag is set.
            this.client.status = 'done';

            repairZone.disableInteractive();
            repairBtn.fillStyle(0x7f8c8d, 1);
            repairBtn.fillRect(width / 2 - 50, 150, 100, 25);
            repairText.setText('Reparado!');

            setTimeout(() => {
                this.ui.fadeTransition('WorkshopScene');
            }, 1000);
        });
    }
}
