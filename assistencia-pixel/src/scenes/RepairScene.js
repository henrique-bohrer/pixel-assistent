import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';

export class RepairScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RepairScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.clientData = this.registry.get('currentClient');
        this.progressionManager = this.registry.get('progressionManager');

        this.uiManager = new UIManager(this, this.progressionManager);

        // Background
        this.add.rectangle(0, 0, width, height, 0x332222).setOrigin(0, 0);
        this.add.text(width / 2, 40, `Reparando: ${this.clientData.defect.name}`, { fontFamily: 'monospace', fontSize: '14px', fill: '#fff' }).setOrigin(0.5);

        // Phone Internal Sprite (placeholder tint)
        this.phoneSprite = this.add.image(width / 2, height / 2 + 20, this.clientData.model.sprite).setScale(1.2).setTint(0xaaaaaa);

        // Determine Minigame
        const minigameType = this.clientData.defect.minigame;

        switch(minigameType) {
            case 'screen_replacement':
                this.startScreenMinigame();
                break;
            case 'battery_replacement':
                this.startBatteryMinigame();
                break;
            case 'soldering':
                this.startSolderingMinigame();
                break;
            case 'cleaning':
                this.startCleaningMinigame();
                break;
            default:
                this.finishRepair(true); // fallback
        }

        this.uiManager.fadeIn(200);
    }

    startScreenMinigame() {
        this.uiManager.showToast('Arraste o conector da nova tela para o encaixe.');

        const targetX = this.cameras.main.width / 2;
        const targetY = this.cameras.main.height / 2 - 20;

        // Target socket
        this.add.rectangle(targetX, targetY, 20, 10, 0x555555).setStrokeStyle(1, 0xffffff);

        // Screen connector (draggable)
        const connector = this.add.rectangle(targetX + 60, targetY + 40, 20, 10, 0x00ffcc).setInteractive({ draggable: true });

        this.input.setDraggable(connector);

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;

            if (Phaser.Math.Distance.Between(gameObject.x, gameObject.y, targetX, targetY) < 10) {
                gameObject.x = targetX;
                gameObject.y = targetY;
                gameObject.disableInteractive();
                this.finishRepair(true);
            }
        });
    }

    startBatteryMinigame() {
        this.uiManager.showToast('Puxe a bateria velha com cuidado (Barra de tensão).');

        const battery = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2 + 20, 30, 50, 0xaa0000).setInteractive();

        // Tension bar
        const barBg = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height - 20, 100, 10, 0x000000).setOrigin(0.5);
        barBg.setStrokeStyle(1, 0xffffff);
        const tensionFill = this.add.rectangle(this.cameras.main.width / 2 - 50, this.cameras.main.height - 20, 0, 10, 0xff0000).setOrigin(0, 0.5);

        let tension = 0;
        let pulling = false;
        let progress = 0;

        battery.on('pointerdown', () => { pulling = true; });
        this.input.on('pointerup', () => { pulling = false; });

        this.events.on('update', () => {
            if (progress >= 100) return; // done

            if (pulling) {
                tension += 2;
                progress += 0.5;
                battery.y -= 0.2; // visual cue
            } else {
                tension -= 1;
            }

            // Clamp
            if (tension < 0) tension = 0;
            if (tension > 100) {
                // Failed!
                this.uiManager.showToast('A bateria estufou! Falha no reparo.');
                this.finishRepair(false);
                progress = 100; // stop updating
                return;
            }

            tensionFill.width = tension;
            tensionFill.setFillStyle(tension > 80 ? 0xff0000 : (tension > 50 ? 0xffff00 : 0x00ff00));

            if (progress >= 100 && tension <= 100) {
                battery.destroy();
                barBg.destroy();
                tensionFill.destroy();
                this.finishRepair(true);
            }
        });
    }

    startSolderingMinigame() {
        this.uiManager.showToast('Segure para aquecer até a zona verde, depois solte.');

        const targetComponent = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, 15, 15, 0x888888).setInteractive();

        // Temp bar
        const barBg = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height - 20, 100, 10, 0x000000).setOrigin(0.5);
        barBg.setStrokeStyle(1, 0xffffff);

        // Target Zone (60 to 80)
        this.add.rectangle(this.cameras.main.width / 2 + 10, this.cameras.main.height - 20, 20, 10, 0x00ff00).setOrigin(0.5);

        const tempFill = this.add.rectangle(this.cameras.main.width / 2 - 50, this.cameras.main.height - 20, 0, 10, 0xff0000).setOrigin(0, 0.5);

        let temp = 0;
        let heating = false;
        let finished = false;

        targetComponent.on('pointerdown', () => { heating = true; });
        this.input.on('pointerup', () => {
            heating = false;
            if (!finished) {
                if (temp >= 60 && temp <= 80) {
                    targetComponent.setFillStyle(0xaaaaaa); // fixed
                    this.finishRepair(true);
                    finished = true;
                } else if (temp > 0) {
                    this.uiManager.showToast('Temperatura incorreta! Tentando de novo...');
                    temp = 0;
                }
            }
        });

        this.events.on('update', () => {
            if (finished) return;
            if (heating) {
                temp += 1.5;
                if (temp > 100) {
                    this.uiManager.showToast('Queimou o componente! Falha.');
                    this.finishRepair(false);
                    finished = true;
                }
            } else {
                temp -= 0.5;
                if (temp < 0) temp = 0;
            }
            tempFill.width = temp;
        });
    }

    startCleaningMinigame() {
        this.uiManager.showToast('Esfregue a área oxidada.');

        const stain = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2 + 10, 40, 40, 0x005500, 0.8);

        let cleanProgress = 0;

        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                // Check if mouse is over stain
                if (Phaser.Math.Distance.Between(pointer.x, pointer.y, stain.x, stain.y) < 30) {
                    cleanProgress += 1;
                    stain.alpha = 1 - (cleanProgress / 100);

                    // Add some particles
                    let p = this.add.rectangle(pointer.x + Phaser.Math.Between(-10,10), pointer.y + Phaser.Math.Between(-10,10), 2, 2, 0x00ff00);
                    this.tweens.add({
                        targets: p,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => p.destroy()
                    });

                    if (cleanProgress >= 100) {
                        stain.destroy();
                        this.finishRepair(true);
                        cleanProgress = -999; // prevent trigger again
                    }
                }
            }
        });
    }

    finishRepair(success) {
        // Stop update loops
        this.events.off('update');

        if (success) {
            this.uiManager.showToast('Reparo concluído!');
        }

        // Slight delay before going back to Workshop (Skipping assembly for brevity/flow,
        // as Assembly is functionally identical to Diagnosis but reverse, we streamline it to return to Workshop).
        this.time.delayedCall(1500, () => {
            this.registry.set('lastRepairResult', {
                success: success,
                reward: this.clientData.reward
            });
            this.uiManager.fadeOut(200, () => {
                this.scene.start('WorkshopScene');
            });
        });
    }
}
