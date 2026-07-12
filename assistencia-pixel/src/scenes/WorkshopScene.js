import Phaser from 'phaser';
import { dataManager } from '../systems/DataManager';
import { UIManager } from '../systems/UIManager';

export class WorkshopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorkshopScene' });
        this.kanbanData = {
            todo: [],
            inProgress: [],
            done: []
        };
    }

    create() {
        this.cameras.main.fadeIn(200, 0, 0, 0);
        this.cameras.main.setBackgroundColor('#2c3e50'); // Workbench color

        this.ui = new UIManager(this);
        this.ui.createHUD();

        // Check if any inProgress items were marked as 'done' in RepairScene
        for (let i = this.kanbanData.inProgress.length - 1; i >= 0; i--) {
            if (this.kanbanData.inProgress[i].status === 'done') {
                const finishedClient = this.kanbanData.inProgress.splice(i, 1)[0];
                this.kanbanData.done.push(finishedClient);
            }
        }

        // Populate initial data if empty
        if (this.kanbanData.todo.length === 0 && this.kanbanData.inProgress.length === 0 && this.kanbanData.done.length === 0) {
            this.kanbanData.todo.push(dataManager.getRandomClient());
            this.kanbanData.todo.push(dataManager.getRandomClient());
        }

        this.drawKanbanBoard();

        // Spawn a new client every 30 seconds
        this.time.addEvent({
            delay: 30000,
            callback: () => {
                if(this.kanbanData.todo.length < 5) {
                    this.kanbanData.todo.push(dataManager.getRandomClient());
                    this.drawKanbanBoard();
                    this.ui.showToast("Novo cliente chegou!", 0x3498db);
                }
            },
            loop: true
        });
    }

    drawKanbanBoard() {
        // Clear previous board if any
        if (this.kanbanGroup) {
            this.kanbanGroup.destroy(true);
        }
        this.kanbanGroup = this.add.group();

        const colY = 40;
        const colW = 110;
        const colH = 160;
        const spacing = 15;
        const startX = 20;

        const columns = [
            { key: 'todo', title: 'Pedidos', x: startX, color: 0xe74c3c, data: this.kanbanData.todo },
            { key: 'inProgress', title: 'Em Progresso', x: startX + colW + spacing, color: 0xf1c40f, data: this.kanbanData.inProgress },
            { key: 'done', title: 'Prontos', x: startX + (colW + spacing) * 2, color: 0x2ecc71, data: this.kanbanData.done }
        ];

        columns.forEach(col => {
            // Column BG
            const bg = this.add.graphics();
            bg.fillStyle(0x34495e, 1);
            bg.fillRect(col.x, colY, colW, colH);
            this.kanbanGroup.add(bg);

            // Column Header
            const header = this.add.graphics();
            header.fillStyle(col.color, 1);
            header.fillRect(col.x, colY, colW, 20);
            this.kanbanGroup.add(header);

            const title = this.add.text(col.x + colW/2, colY + 10, col.title, {
                fontFamily: 'monospace', fontSize: '10px', fill: (col.key === 'inProgress' ? '#000' : '#fff'), fontStyle: 'bold'
            }).setOrigin(0.5);
            this.kanbanGroup.add(title);

            // Items
            col.data.forEach((client, index) => {
                const itemY = colY + 25 + (index * 35);

                const itemBg = this.add.graphics();
                itemBg.fillStyle(0xecf0f1, 1);
                itemBg.fillRoundedRect(col.x + 5, itemY, colW - 10, 30, 4);
                this.kanbanGroup.add(itemBg);

                const itemText = this.add.text(col.x + 10, itemY + 5, client.model.name, {
                    fontFamily: 'monospace', fontSize: '10px', fill: '#2c3e50'
                });
                this.kanbanGroup.add(itemText);

                const actionText = this.add.text(col.x + 10, itemY + 18,
                    col.key === 'todo' ? 'Diagnosticar >' : (col.key === 'inProgress' ? 'Reparar >' : 'Entregar >'),
                    { fontFamily: 'monospace', fontSize: '9px', fill: '#2980b9' }
                );
                this.kanbanGroup.add(actionText);

                // Interactive zone
                const zone = this.add.zone(col.x + colW/2, itemY + 15, colW - 10, 30).setInteractive({ cursor: 'pointer' });
                zone.on('pointerdown', () => this.handleClientClick(client, col.key, index));
                this.kanbanGroup.add(zone);
            });
        });
    }

    handleClientClick(client, columnKey, index) {
        if (columnKey === 'todo') {
            // Move to in progress and go to Diagnosis
            this.kanbanData.todo.splice(index, 1);
            this.kanbanData.inProgress.push(client);
            this.ui.fadeTransition('DiagnosisScene', { client: client });
        } else if (columnKey === 'inProgress') {
            // Go to Repair
            this.ui.fadeTransition('RepairScene', { client: client });
        } else if (columnKey === 'done') {
            // Deliver and get rewards
            this.kanbanData.done.splice(index, 1);
            dataManager.addCoins(50 + (client.model.difficulty * 10));
            dataManager.addReputation(5);
            this.ui.showToast("Aparelho Entregue! +Moedas +Rep", 0x2ecc71);
            this.ui.updateHUD();
            this.drawKanbanBoard();
        }
    }
}
