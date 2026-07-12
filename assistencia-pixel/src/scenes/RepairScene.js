import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { dataManager } from '../systems/DataManager';

export class RepairScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RepairScene' });
    }

    init(data) {
        this.client = data.client;
        this.activeTool = null; // null, 'screwdriver', 'brush', 'soldering_iron'
        this.toolButtons = {};
        this.phase = 'DISASSEMBLY'; // DISASSEMBLY, REPAIR, ASSEMBLY
    }

    create() {
        this.cameras.main.fadeIn(200, 0, 0, 0);
        this.cameras.main.setBackgroundColor('#273c75');

        this.ui = new UIManager(this);
        this.ui.createHUD();

        const width = this.scale.width;
        const height = this.scale.height;

        this.add.text(width / 2, 35, 'Mesa de Reparo', {
            fontFamily: 'monospace', fontSize: '14px', fill: '#fff'
        }).setOrigin(0.5);

        this.phaseText = this.add.text(width / 2, 50, 'Fase: Desmontagem', {
            fontFamily: 'monospace', fontSize: '12px', fill: '#f39c12'
        }).setOrigin(0.5);

        this.createToolbar(width, height);

        const partId = this.client.defect.required_part;
        const partData = dataManager.parts.find(p => p.id === partId);

        // Position these texts a bit higher or to the left so they don't overlap the phone
        this.add.text(10, 35, `Defeito: ${this.client.defect.name}`, {
            fontFamily: 'monospace', fontSize: '10px', fill: '#bdc3c7', align: 'left'
        }).setOrigin(0, 0.5).setDepth(1);

        const hasPart = dataManager.playerState.inventory[partId] > 0;

        if (hasPart || this.client.defect.minigame === 'cleaning') {
            if (partId !== "part_alcohol") {
                this.add.text(10, 50, `Estoque: ${partData.name} (${dataManager.playerState.inventory[partId]})`, {
                    fontFamily: 'monospace', fontSize: '10px', fill: '#2ecc71', align: 'left'
                }).setOrigin(0, 0.5).setDepth(1);
            }
            this.createMinigameSimulation(width, height, partId);
        } else {
            const missingText = this.add.text(width / 2, 80, `Falta peça: ${partData.name}. Custa ${partData.cost} moedas.`, {
                fontFamily: 'monospace', fontSize: '10px', fill: '#e74c3c'
            }).setOrigin(0.5).setDepth(0);

            const buyBtn = this.add.graphics();
            buyBtn.fillStyle(0x3498db, 1);
            buyBtn.fillRect(width / 2 - 50, 95, 100, 30);
            buyBtn.setDepth(0);

            const buyText = this.add.text(width / 2, 110, 'Comprar Peça', {
                fontFamily: 'monospace', fontSize: '10px', fill: '#fff'
            }).setOrigin(0.5).setDepth(0);

            const buyZone = this.add.zone(width / 2, 110, 100, 30).setInteractive({ cursor: 'pointer' });
            buyZone.setDepth(10);

            buyZone.on('pointerdown', () => {
                if (dataManager.playerState.coins >= partData.cost) {
                    dataManager.addCoins(-partData.cost);
                    dataManager.playerState.inventory[partId]++;
                    this.ui.updateHUD();
                    this.ui.showToast("Peça comprada!", 0x2ecc71);

                    missingText.destroy();
                    buyBtn.destroy();
                    buyText.destroy();
                    buyZone.destroy();

                    this.add.text(10, 50, `Estoque: ${partData.name} (${dataManager.playerState.inventory[partId]})`, {
                        fontFamily: 'monospace', fontSize: '10px', fill: '#2ecc71', align: 'left'
                    }).setOrigin(0, 0.5).setDepth(1);

                    this.createMinigameSimulation(width, height, partId);
                } else {
                    this.ui.showToast("Moedas insuficientes!", 0xe74c3c);
                }
            });
        }

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

        this.toolButtons.screwdriver = this.createToolButton(toolbarX, toolbarY, '🔧', 'screwdriver');
        this.toolButtons.brush = this.createToolButton(toolbarX, toolbarY + 40, '🖌️', 'brush');
        this.toolButtons.soldering_iron = this.createToolButton(toolbarX, toolbarY + 80, '🖊️', 'soldering_iron');
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
            this.activeTool = null;
            this.input.setDefaultCursor('default');
        } else {
            this.activeTool = toolId;
            if (toolId === 'screwdriver') {
                this.input.setDefaultCursor('crosshair');
            } else if (toolId === 'brush') {
                this.input.setDefaultCursor('help');
            } else if (toolId === 'soldering_iron') {
                this.input.setDefaultCursor('crosshair');
            }
        }

        for (const [id, btn] of Object.entries(this.toolButtons)) {
            btn.bg.clear();
            if (this.activeTool === id) {
                btn.bg.fillStyle(0xf1c40f, 1);
            } else {
                btn.bg.fillStyle(0x34495e, 1);
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
        this.phoneX = width / 2 - 20;
        this.phoneY = height / 2 + 10;

        // 1. Motherboard (Bottom Layer)
        this.motherboard = this.add.graphics();
        this.motherboard.setDepth(1);
        this.motherboard.fillStyle(0x27ae60, 1); // Green PCB
        this.motherboard.fillRect(this.phoneX - phoneW/2, this.phoneY - phoneH/2, phoneW, phoneH);

        // Add some PCB tracks (decorative)
        this.motherboard.lineStyle(1, 0x2ecc71, 0.6);
        this.motherboard.beginPath();
        this.motherboard.moveTo(this.phoneX - 30, this.phoneY - 50);
        this.motherboard.lineTo(this.phoneX - 10, this.phoneY - 50);
        this.motherboard.lineTo(this.phoneX, this.phoneY - 30);
        this.motherboard.strokePath();

        // Battery
        this.battery = this.add.graphics();
        this.battery.setDepth(2);
        this.battery.fillStyle(0x34495e, 1);
        this.battery.fillRect(this.phoneX - phoneW/2 + 5, this.phoneY - 10, phoneW - 10, phoneH/2 - 5);
        this.battery.lineStyle(2, 0x2c3e50);
        this.battery.strokeRect(this.phoneX - phoneW/2 + 5, this.phoneY - 10, phoneW - 10, phoneH/2 - 5);
        this.batteryZone = this.add.zone(this.phoneX, this.phoneY + 20, phoneW - 10, phoneH/2 - 5);

        // Chip
        this.chip = this.add.graphics();
        this.chip.setDepth(2);
        this.chip.fillStyle(0x111111, 1);
        this.chip.fillRect(this.phoneX - 20, this.phoneY - 40, 40, 20);
        this.chipZone = this.add.zone(this.phoneX, this.phoneY - 30, 40, 20);

        // Flex Cable connector base
        this.flexBase = this.add.graphics();
        this.flexBase.setDepth(2);
        this.flexBase.fillStyle(0x7f8c8d, 1);
        this.flexBase.fillRect(this.phoneX + 25, this.phoneY - 40, 10, 20);

        // 2. Screen Layer (Top Layer)
        this.screenGroup = this.add.container(this.phoneX, this.phoneY);
        this.screenGroup.setDepth(3);
        this.screenBg = this.add.graphics();
        if (this.client.defect.minigame === 'screen_replacement') {
            // Broken screen style
            this.screenBg.fillStyle(0x222222, 1);
            this.screenBg.fillRect(-phoneW/2, -phoneH/2, phoneW, phoneH);
            this.screenBg.lineStyle(1, 0xffffff, 0.5);
            this.screenBg.beginPath();
            this.screenBg.moveTo(-20, -40); this.screenBg.lineTo(30, 20);
            this.screenBg.moveTo(10, -50); this.screenBg.lineTo(-30, 40);
            this.screenBg.strokePath();
        } else {
            this.screenBg.fillStyle(0x1a1a1a, 1);
            this.screenBg.fillRect(-phoneW/2, -phoneH/2, phoneW, phoneH);
        }
        this.screenBg.lineStyle(2, 0x555555, 1);
        this.screenBg.strokeRect(-phoneW/2, -phoneH/2, phoneW, phoneH);

        this.screenText = this.add.text(0, 0, 'TELA', { fontSize: '12px', fill: '#555' }).setOrigin(0.5);

        // Flex Cable attached to screen
        this.flexCable = this.add.graphics();
        this.flexCable.fillStyle(0xd35400, 1); // Orange flex cable
        this.flexCable.fillRect(25, -40, 30, 10);

        this.screenGroup.add([this.screenBg, this.screenText, this.flexCable]);

        // 3. Screws
        this.screws = [];
        this.screwPositions = [
            {x: -phoneW/2 + 5, y: -phoneH/2 + 5},
            {x: phoneW/2 - 5, y: -phoneH/2 + 5},
            {x: -phoneW/2 + 5, y: phoneH/2 - 5},
            {x: phoneW/2 - 5, y: phoneH/2 - 5}
        ];

        this.screwsRemoved = 0;

        this.createScrews();
    }

    createScrews() {
        this.screwPositions.forEach(pos => {
            const screw = this.add.graphics();
            screw.fillStyle(0xbdc3c7, 1);
            screw.fillCircle(pos.x, pos.y, 4);

            const zone = this.add.zone(pos.x, pos.y, 16, 16).setInteractive({ cursor: 'pointer' });

            this.screenGroup.add([screw, zone]);

            zone.on('pointerdown', () => {
                if (this.phase === 'DISASSEMBLY' && this.activeTool === 'screwdriver') {
                    // Unscrew animation
                    this.tweens.add({
                        targets: screw,
                        angle: 360,
                        duration: 300,
                        onComplete: () => {
                            this.tweens.add({
                                targets: screw,
                                y: screw.y + 100,
                                alpha: 0,
                                duration: 300,
                                onComplete: () => {
                                    screw.destroy();
                                    zone.destroy();
                                }
                            });
                        }
                    });

                    this.screwsRemoved++;
                    this.ui.showToast(`Parafuso removido (${this.screwsRemoved}/4)`, 0x3498db);

                    if (this.screwsRemoved === 4) {
                        this.enableScreenDrag(80, 120);
                    }
                } else if (this.activeTool !== 'screwdriver') {
                    this.ui.showToast("Use a chave Phillips!", 0xe74c3c);
                }
            });
        });
    }

    enableScreenDrag(w, h) {
        this.ui.showToast("Tela desparafusada! Arraste para o lado para abrir.", 0x2ecc71);

        const hitArea = new Phaser.Geom.Rectangle(-w/2, -h/2, w, h);
        this.screenGroup.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.input.setDraggable(this.screenGroup);

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === this.screenGroup && this.phase === 'DISASSEMBLY') {
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
            if (gameObject === this.screenGroup && this.phase === 'DISASSEMBLY') {
                if (gameObject.x < this.scale.width / 2 - 80) {
                    gameObject.disableInteractive();
                    this.ui.showToast("Aparelho Aberto!", 0x2ecc71);
                    this.startRepairPhase();
                } else {
                    this.tweens.add({
                        targets: gameObject,
                        x: this.phoneX,
                        y: this.phoneY,
                        duration: 200
                    });
                }
            }
        });
    }

    startRepairPhase() {
        this.phase = 'REPAIR';
        this.phaseText.setText('Fase: Reparo');
        this.phaseText.setColor('#3498db');

        const minigame = this.client.defect.minigame;

        if (minigame === 'cleaning') {
            this.startCleaningMinigame();
        } else if (minigame === 'battery_replacement') {
            this.startBatteryMinigame();
        } else if (minigame === 'soldering') {
            this.startSolderingMinigame();
        } else if (minigame === 'screen_replacement') {
            this.startScreenMinigame();
        } else {
            this.finishRepairTask(); // Fallback
        }
    }

    startCleaningMinigame() {
        this.ui.showToast("Use o pincel para limpar a oxidação!", 0xf1c40f);

        this.dirtCleanedCount = 0;
        const dirtPositions = [
            {x: this.phoneX, y: this.phoneY - 20},
            {x: this.phoneX - 15, y: this.phoneY + 20},
            {x: this.phoneX + 15, y: this.phoneY + 10}
        ];

        dirtPositions.forEach(pos => {
            const dirt = this.add.graphics();
            dirt.fillStyle(0x8B4513, 0.9);
            dirt.fillCircle(pos.x, pos.y, 8);

            const zone = this.add.zone(pos.x, pos.y, 20, 20).setInteractive();

            zone.on('pointerover', () => {
                if (this.activeTool === 'brush') {
                    dirt.destroy();
                    zone.destroy();
                    this.dirtCleanedCount++;

                    // Small effect representation

                    if (this.dirtCleanedCount === 3) {
                        this.ui.showToast("Placa limpa!", 0x2ecc71);
                        this.finishRepairTask();
                    }
                }
            });
            zone.on('pointerdown', () => {
                if (this.activeTool !== 'brush') {
                    this.ui.showToast("Use o pincel!", 0xe74c3c);
                }
            });
        });
    }

    startBatteryMinigame() {
        this.ui.showToast("Arraste a bateria antiga para fora.", 0xf1c40f);

        // Make battery draggable
        const w = 70;
        const h = 55;
        this.batteryZone.setInteractive();
        this.input.setDraggable(this.batteryZone);

        // Follow zone with graphics
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === this.batteryZone && this.phase === 'REPAIR') {
                gameObject.x = dragX;
                gameObject.y = dragY;
                this.battery.clear();
                this.battery.fillStyle(0x34495e, 1);
                this.battery.fillRect(gameObject.x - w/2, gameObject.y - h/2, w, h);
                this.battery.lineStyle(1, 0x111111);
                this.battery.strokeRect(gameObject.x - w/2, gameObject.y - h/2, w, h);
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
            if (gameObject === this.batteryZone && this.phase === 'REPAIR') {
                if (gameObject.y > this.scale.height - 40 || gameObject.x > this.scale.width - 50) {
                    gameObject.destroy();
                    this.battery.destroy();
                    this.ui.showToast("Bateria removida. Clique para instalar nova.", 0x2ecc71);

                    // Create drop zone for new battery
                    const dropZone = this.add.zone(this.phoneX, this.phoneY + 20, w, h).setInteractive({ cursor: 'pointer' });
                    dropZone.on('pointerdown', () => {
                        dropZone.destroy();
                        this.battery = this.add.graphics();
                        this.battery.fillStyle(0x2980b9, 1); // Blue new battery
                        this.battery.fillRect(this.phoneX - w/2, this.phoneY + 20 - h/2, w, h);
                        this.ui.showToast("Nova bateria instalada!", 0x2ecc71);
                        this.finishRepairTask();
                    });
                } else {
                    // Snap back
                    gameObject.x = this.phoneX;
                    gameObject.y = this.phoneY + 20;
                    this.battery.clear();
                    this.battery.fillStyle(0x34495e, 1);
                    this.battery.fillRect(gameObject.x - w/2, gameObject.y - h/2, w, h);
                }
            }
        });
    }

    startSolderingMinigame() {
        this.ui.showToast("Remova o chip antigo (clique).", 0xf1c40f);

        this.chipZone.setInteractive({ cursor: 'pointer' });

        this.chipZone.once('pointerdown', () => {
            this.chip.destroy();
            this.chipZone.destroy();

            this.ui.showToast("Use o Ferro de Solda nos contatos.", 0xf1c40f);

            // New chip placeholder
            this.chip = this.add.graphics();
            this.chip.fillStyle(0x111111, 0.5); // Ghost chip
            this.chip.fillRect(this.phoneX - 20, this.phoneY - 40, 40, 20);

            // Soldering points
            const points = [
                {x: this.phoneX - 15, y: this.phoneY - 40},
                {x: this.phoneX + 15, y: this.phoneY - 40},
                {x: this.phoneX - 15, y: this.phoneY - 20},
                {x: this.phoneX + 15, y: this.phoneY - 20}
            ];

            this.pointsSoldered = 0;

            points.forEach(pos => {
                const point = this.add.graphics();
                point.fillStyle(0x95a5a6, 1);
                point.fillCircle(pos.x, pos.y, 3);

                const zone = this.add.zone(pos.x, pos.y, 15, 15).setInteractive();

                zone.on('pointerdown', () => {
                    if (this.activeTool === 'soldering_iron') {
                        point.clear();
                        point.fillStyle(0xf1c40f, 1); // Gold solder
                        point.fillCircle(pos.x, pos.y, 4);
                        zone.destroy();
                        this.pointsSoldered++;

                        if (this.pointsSoldered === 4) {
                            this.chip.clear();
                            this.chip.fillStyle(0x111111, 1); // Solid new chip
                            this.chip.fillRect(this.phoneX - 20, this.phoneY - 40, 40, 20);
                            this.ui.showToast("Chip soldado com sucesso!", 0x2ecc71);
                            this.finishRepairTask();
                        }
                    } else {
                        this.ui.showToast("Use o Ferro de Solda!", 0xe74c3c);
                    }
                });
            });
        });
    }

    startScreenMinigame() {
        this.ui.showToast("A tela velha já foi removida. Clique para instalar nova.", 0xf1c40f);

        // Screen is already moved aside. Let's make clicking the board add the new screen.
        const boardZone = this.add.zone(this.phoneX, this.phoneY, 80, 120).setInteractive({ cursor: 'pointer' });

        boardZone.once('pointerdown', () => {
            // Destroy old broken screen
            this.screenGroup.destroy();

            // Create new pristine screen, but offset to the right, ready for assembly
            this.screenGroup = this.add.container(this.scale.width / 2 + 80, this.phoneY);
            this.screenBg = this.add.graphics();
            this.screenBg.fillStyle(0x1a1a1a, 1);
            this.screenBg.fillRect(-40, -60, 80, 120);
            this.screenBg.lineStyle(2, 0x555555, 1);
            this.screenBg.strokeRect(-40, -60, 80, 120);
            this.screenText = this.add.text(0, 0, 'NOVA TELA', { fontSize: '10px', fill: '#555' }).setOrigin(0.5);

            this.flexCable = this.add.graphics();
            this.flexCable.fillStyle(0xd35400, 1); // Orange flex cable
            this.flexCable.fillRect(25, -40, 30, 10);

            this.screenGroup.add([this.screenBg, this.screenText, this.flexCable]);

            this.ui.showToast("Nova tela conectada no flex!", 0x2ecc71);
            this.finishRepairTask();
        });
    }

    finishRepairTask() {
        // Consume part
        if (this.partId !== 'part_alcohol') {
            dataManager.playerState.inventory[this.partId]--;
            dataManager.saveProgress();
        }

        this.ui.showToast("Reparo concluído! Arraste a tela para fechar.", 0x2ecc71);

        this.phase = 'ASSEMBLY';
        this.phaseText.setText('Fase: Montagem');
        this.phaseText.setColor('#2ecc71');

        // Re-enable screen drag for assembly
        const hitArea = new Phaser.Geom.Rectangle(-40, -60, 80, 120);
        this.screenGroup.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.input.setDraggable(this.screenGroup);

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === this.screenGroup && this.phase === 'ASSEMBLY') {
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
            if (gameObject === this.screenGroup && this.phase === 'ASSEMBLY') {
                // Check if close to center
                if (Math.abs(gameObject.x - this.phoneX) < 20 && Math.abs(gameObject.y - this.phoneY) < 20) {
                    gameObject.x = this.phoneX;
                    gameObject.y = this.phoneY;
                    gameObject.disableInteractive();

                    this.ui.showToast("Tela encaixada. Recoloque os parafusos.", 0x3498db);
                    this.startScrewingPhase();
                }
            }
        });
    }

    startScrewingPhase() {
        this.screwsScrewed = 0;

        this.screwPositions.forEach(pos => {
            const screwHole = this.add.graphics();
            screwHole.fillStyle(0x111111, 1);
            screwHole.fillCircle(pos.x, pos.y, 4);

            const zone = this.add.zone(pos.x, pos.y, 16, 16).setInteractive({ cursor: 'pointer' });
            this.screenGroup.add([screwHole, zone]);

            zone.on('pointerdown', () => {
                if (this.activeTool === 'screwdriver') {
                    screwHole.clear();
                    screwHole.fillStyle(0xbdc3c7, 1); // Silver screw
                    screwHole.fillCircle(pos.x, pos.y, 4);

                    zone.destroy();
                    this.screwsScrewed++;
                    this.ui.showToast(`Parafuso colocado (${this.screwsScrewed}/4)`, 0x3498db);

                    if (this.screwsScrewed === 4) {
                        this.completeAssembly();
                    }
                } else {
                    this.ui.showToast("Use a chave Phillips!", 0xe74c3c);
                }
            });
        });
    }

    completeAssembly() {
        this.ui.showToast("Aparelho montado com sucesso!", 0x2ecc71);
        this.client.status = 'done';

        setTimeout(() => {
            this.ui.fadeTransition('WorkshopScene');
        }, 1500);
    }
}
