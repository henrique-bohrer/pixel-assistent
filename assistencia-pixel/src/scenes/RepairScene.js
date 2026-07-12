import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { dataManager } from '../systems/DataManager';

export class RepairScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RepairScene' });
    }

    init(data) {
        this.client = data.client;
        this.activeTool = null; // null, 'screwdriver', 'brush'
        this.toolButtons = {};
    }

    create() {
        this.cameras.main.fadeIn(200, 0, 0, 0);
        this.cameras.main.setBackgroundColor('#273c75'); // Workbench color

        this.ui = new UIManager(this);
        this.ui.createHUD();

        const width = this.scale.width;
        const height = this.scale.height;

        this.add.text(width / 2, 35, 'Mesa de Reparo', {
            fontFamily: 'monospace', fontSize: '14px', fill: '#fff'
        }).setOrigin(0.5);

        this.createToolbar(width, height);

        // Display Required Part
        const partId = this.client.defect.required_part;
        const partData = dataManager.parts.find(p => p.id === partId);

        this.add.text(width / 2, 50, `Defeito: ${this.client.defect.name} | Peça: ${partData.name}`, {
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

    createToolbar(width, height) {
        const toolbarX = width - 40;
        const toolbarY = 80;

        // Screwdriver Button
        this.toolButtons.screwdriver = this.createToolButton(toolbarX, toolbarY, '🔧', 'screwdriver');

        // Brush Button
        this.toolButtons.brush = this.createToolButton(toolbarX, toolbarY + 40, '🖌️', 'brush');
    }

    createToolButton(x, y, icon, toolId) {
        const bg = this.add.graphics();
        bg.fillStyle(0x34495e, 1);
        bg.fillRoundedRect(x, y, 30, 30, 4);

        const text = this.add.text(x + 15, y + 15, icon, { fontSize: '16px' }).setOrigin(0.5);

        const zone = this.add.zone(x + 15, y + 15, 30, 30).setInteractive({ cursor: 'pointer' });

        zone.on('pointerdown', () => {
            this.setActiveTool(toolId);
        });

        return { bg, text, zone, x, y };
    }

    setActiveTool(toolId) {
        if (this.activeTool === toolId) {
            // Deselect
            this.activeTool = null;
        } else {
            this.activeTool = toolId;
        }

        // Update visual state
        for (const [id, btn] of Object.entries(this.toolButtons)) {
            btn.bg.clear();
            if (this.activeTool === id) {
                btn.bg.fillStyle(0xf1c40f, 1); // Highlight
            } else {
                btn.bg.fillStyle(0x34495e, 1); // Normal
            }
            btn.bg.fillRoundedRect(btn.x, btn.y, 30, 30, 4);
        }

        if (this.activeTool) {
            this.ui.showToast(`Ferramenta: ${toolId}`, 0xf1c40f);
        }
    }

    createMinigameSimulation(width, height, partId) {
        this.partId = partId;
        const phoneW = 80;
        const phoneH = 120;
        const phoneX = width / 2 - 20; // Slightly off-center to allow room for the screen to be dragged
        const phoneY = height / 2 + 10;

        // 1. Motherboard (Bottom Layer)
        this.motherboard = this.add.graphics();
        this.motherboard.fillStyle(0x27ae60, 1); // Green PCB
        this.motherboard.fillRect(phoneX - phoneW/2, phoneY - phoneH/2, phoneW, phoneH);

        // Battery block
        this.motherboard.fillStyle(0x2c3e50, 1);
        this.motherboard.fillRect(phoneX - phoneW/2 + 5, phoneY - 10, phoneW - 10, phoneH/2 - 5);

        // Chip block
        this.motherboard.fillStyle(0x111111, 1);
        this.motherboard.fillRect(phoneX - 20, phoneY - 40, 40, 20);

        // 2. Screen Layer (Top Layer, Draggable later)
        this.screenGroup = this.add.container(phoneX, phoneY);
        this.screenBg = this.add.graphics();
        this.screenBg.fillStyle(0x1a1a1a, 1);
        this.screenBg.fillRect(-phoneW/2, -phoneH/2, phoneW, phoneH);
        this.screenBg.lineStyle(2, 0x555555, 1);
        this.screenBg.strokeRect(-phoneW/2, -phoneH/2, phoneW, phoneH);

        const screenText = this.add.text(0, 0, 'TELA', { fontSize: '12px', fill: '#555' }).setOrigin(0.5);
        this.screenGroup.add([this.screenBg, screenText]);

        // 3. Screws
        this.screws = [];
        const screwPositions = [
            {x: -phoneW/2 + 5, y: -phoneH/2 + 5},
            {x: phoneW/2 - 5, y: -phoneH/2 + 5},
            {x: -phoneW/2 + 5, y: phoneH/2 - 5},
            {x: phoneW/2 - 5, y: phoneH/2 - 5}
        ];

        this.screwsRemoved = 0;

        screwPositions.forEach(pos => {
            const screw = this.add.graphics();
            screw.fillStyle(0xbdc3c7, 1);
            screw.fillCircle(pos.x, pos.y, 4);

            const zone = this.add.zone(pos.x, pos.y, 16, 16).setInteractive({ cursor: 'pointer' });

            this.screenGroup.add([screw, zone]);

            zone.on('pointerdown', () => {
                if (this.activeTool === 'screwdriver') {
                    // Remove screw animation
                    this.tweens.add({
                        targets: screw,
                        y: screw.y + 100, // fall down
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            screw.destroy();
                            zone.destroy();
                        }
                    });
                    this.screwsRemoved++;
                    this.ui.showToast(`Parafuso removido (${this.screwsRemoved}/4)`, 0x3498db);

                    if (this.screwsRemoved === 4) {
                        this.enableScreenDrag(phoneW, phoneH);
                    }
                } else {
                    this.ui.showToast("Use a chave Phillips!", 0xe74c3c);
                }
            });
        });
    }

    enableScreenDrag(w, h) {
        this.ui.showToast("Tela desparafusada! Arraste para abrir.", 0x2ecc71);

        // Add interactive zone to the screen container for dragging
        const hitArea = new Phaser.Geom.Rectangle(-w/2, -h/2, w, h);
        this.screenGroup.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.input.setDraggable(this.screenGroup);

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === this.screenGroup) {
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
            // If dragged far enough to the left, consider it "open"
            if (gameObject.x < this.scale.width / 2 - 80) {
                gameObject.disableInteractive();
                this.ui.showToast("Aparelho Aberto!", 0x2ecc71);
                this.startRepairTask();
            } else {
                // Snap back if not dragged far enough
                this.tweens.add({
                    targets: gameObject,
                    x: this.scale.width / 2 - 20,
                    y: this.scale.height / 2 + 10,
                    duration: 200
                });
            }
        });
    }

    startRepairTask() {
        const width = this.scale.width;

        if (this.client.defect.minigame === 'cleaning') {
            this.startCleaningMinigame();
        } else {
            // General parts replacement for other defects
            const repairBtn = this.add.graphics();
            repairBtn.fillStyle(0x2ecc71, 1);
            repairBtn.fillRect(width / 2 - 50, 180, 100, 25);

            const repairText = this.add.text(width / 2, 192.5, 'Executar Reparo', {
                fontFamily: 'monospace', fontSize: '10px', fill: '#000', fontStyle: 'bold'
            }).setOrigin(0.5);

            const repairZone = this.add.zone(width / 2, 192.5, 100, 25).setInteractive({ cursor: 'pointer' });

            repairZone.on('pointerdown', () => {
                this.finishRepair(repairBtn, repairText, repairZone);
            });
        }
    }

    startCleaningMinigame() {
        this.ui.showToast("Use o pincel para limpar a sujeira!", 0xf1c40f);
        const width = this.scale.width;
        const height = this.scale.height;
        const phoneX = width / 2 - 20;
        const phoneY = height / 2 + 10;

        // Add dirt patches on the motherboard
        this.dirtPatches = [];
        const dirtPositions = [
            {x: phoneX, y: phoneY - 20},
            {x: phoneX - 15, y: phoneY + 20},
            {x: phoneX + 15, y: phoneY + 10}
        ];

        this.dirtCleanedCount = 0;

        dirtPositions.forEach(pos => {
            const dirt = this.add.graphics();
            dirt.fillStyle(0x8B4513, 0.8); // Brown dirt
            dirt.fillCircle(pos.x, pos.y, 10);

            // We use pointerover so the player can "brush" by moving the mouse over them
            const zone = this.add.zone(pos.x, pos.y, 20, 20).setInteractive();

            zone.on('pointerover', () => {
                if (this.activeTool === 'brush') {
                    // Clean it
                    dirt.destroy();
                    zone.destroy();
                    this.dirtCleanedCount++;

                    if (this.dirtCleanedCount === 3) {
                        this.ui.showToast("Placa limpa!", 0x2ecc71);
                        this.finishRepair(null, null, null); // auto-finish when cleaned
                    }
                } else if (this.activeTool) {
                    this.ui.showToast("Use o pincel para limpar!", 0xe74c3c);
                }
            });
        });
    }

    finishRepair(btnGraphics, btnText, btnZone) {
        // Consume part
        dataManager.playerState.inventory[this.partId]--;
        dataManager.saveProgress();

        this.ui.showToast("Reparo concluído com sucesso!", 0x2ecc71);

        // Flag for WorkshopScene
        this.client.status = 'done';

        if (btnZone) btnZone.disableInteractive();
        if (btnGraphics) {
            btnGraphics.fillStyle(0x7f8c8d, 1);
            btnGraphics.fillRect(this.scale.width / 2 - 50, 180, 100, 25);
        }
        if (btnText) btnText.setText('Reparado!');

        setTimeout(() => {
            this.ui.fadeTransition('WorkshopScene');
        }, 1500);
    }
}
