import Phaser from 'phaser';
import { ProgressionManager } from '../systems/ProgressionManager';
import { UIManager } from '../systems/UIManager';
import { DataManager } from '../systems/DataManager';

export class WorkshopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorkshopScene' });
    }

    create() {
        // Initialize Systems if not already global/passed
        // A better approach in a real game would be a global registry, but here we instantiate them.
        // We'll store progressionManager in the registry to persist across scenes.
        if (!this.registry.get('progressionManager')) {
            this.registry.set('progressionManager', new ProgressionManager());
        }
        this.progressionManager = this.registry.get('progressionManager');

        if (!this.registry.get('dataManager')) {
            const dataManager = new DataManager(this);
            dataManager.loadData();
            this.registry.set('dataManager', dataManager);
        }
        this.dataManager = this.registry.get('dataManager');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0x111122).setOrigin(0, 0);

        // Workbench
        this.add.image(width / 2, height - 50, 'workbench').setOrigin(0.5, 0.5);

        // UI Manager
        this.uiManager = new UIManager(this, this.progressionManager);

        // Tools Sidebar
        this.createToolsSidebar();

        // Client Queue
        this.createClientQueue();

        // Phone on desk (Placeholder for active case)
        this.activePhoneArea = this.add.rectangle(width / 2, height - 60, 60, 100, 0x000000, 0); // invisible area
        this.activePhoneText = this.add.text(width / 2, height - 60, 'Nenhum Cliente', {
            fontFamily: 'monospace',
            fontSize: '10px',
            fill: '#888'
        }).setOrigin(0.5);
        this.activePhoneSprite = null;
        this.currentClient = null;

        this.uiManager.fadeIn(200);

        // Check if we came back from a successful repair (via registry data)
        const repairResult = this.registry.get('lastRepairResult');
        if (repairResult) {
            this.handleRepairResult(repairResult);
            this.registry.set('lastRepairResult', null); // Clear it
        }
    }

    createToolsSidebar() {
        // Simple sidebar background
        this.add.rectangle(20, 120, 40, 150, 0x222233).setOrigin(0.5);

        let startY = 60;
        this.progressionManager.inventory.tools.forEach((toolId, index) => {
            const toolBg = this.add.rectangle(20, startY + index * 40, 30, 30, 0x444455).setInteractive({useHandCursor: true});
            toolBg.setStrokeStyle(1, 0x888888);

            // Tool icon (using placeholder)
            this.add.image(20, startY + index * 40, toolId).setScale(0.5);

            toolBg.on('pointerdown', () => {
                this.uiManager.showToast(`Ferramenta: ${this.dataManager.tools.find(t=>t.id===toolId).name}`);
                // Highlight selection (visual feedback only for hub)
                this.children.list.filter(c => c.type === 'Rectangle' && c.width === 30).forEach(c => c.setStrokeStyle(1, 0x888888));
                toolBg.setStrokeStyle(2, 0x00ffcc);
            });
        });
    }

    createClientQueue() {
        // Top right queue
        this.add.text(this.cameras.main.width - 50, 30, 'Fila', {
            fontFamily: 'monospace',
            fontSize: '10px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Generate a few random clients
        for(let i=0; i<3; i++) {
            this.addClientToQueue(i);
        }
    }

    addClientToQueue(index) {
        const clientData = this.dataManager.getRandomClient(this.progressionManager.level);

        const clientIcon = this.add.image(this.cameras.main.width - 50, 50 + index * 30, 'client_icon').setInteractive({useHandCursor: true});

        clientIcon.on('pointerdown', () => {
            if (this.currentClient) {
                this.uiManager.showToast("Termine o caso atual primeiro!");
                return;
            }
            this.acceptClient(clientData, clientIcon);
        });
    }

    acceptClient(clientData, clientIcon) {
        clientIcon.destroy();
        this.currentClient = clientData;

        this.activePhoneText.setVisible(false);
        this.activePhoneSprite = this.add.image(this.cameras.main.width / 2, this.cameras.main.height - 60, clientData.model.sprite);
        this.activePhoneSprite.setInteractive({useHandCursor: true});

        this.uiManager.showToast(`${clientData.clientName} quer um reparo!`);

        // Click on phone to go to diagnosis
        this.activePhoneSprite.on('pointerdown', () => {
            // Pass client data to next scene
            this.registry.set('currentClient', this.currentClient);
            this.uiManager.fadeOut(200, () => {
                this.scene.start('DiagnosisScene');
            });
        });
    }

    handleRepairResult(result) {
        if (result.success) {
            this.progressionManager.addReputation(10);
            this.progressionManager.addCoins(result.reward);
            this.uiManager.showToast(`Sucesso! +${result.reward} Moedas`);
        } else {
            this.progressionManager.addReputation(-5);
            this.uiManager.showToast(`Falha no reparo. Reputação caiu.`);
        }
        this.uiManager.updateHUD();
        // Clear active client
        this.currentClient = null;
        if(this.activePhoneSprite) this.activePhoneSprite.destroy();
        this.activePhoneText.setVisible(true);
        // Add a new client to replace
        this.addClientToQueue(2); // roughly append at bottom
    }
}
