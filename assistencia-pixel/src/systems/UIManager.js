import Phaser from 'phaser';
import { dataManager } from './DataManager';

export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.hudGraphics = null;
        this.reputationText = null;
        this.coinsText = null;
    }

    createHUD() {
        // Simple dark bar at the top
        this.hudGraphics = this.scene.add.graphics();
        this.hudGraphics.fillStyle(0x222222, 1);
        this.hudGraphics.fillRect(0, 0, this.scene.scale.width, 24);
        this.hudGraphics.setDepth(100); // Make sure it's on top

        // Text
        this.reputationText = this.scene.add.text(10, 5, `Rep: ${dataManager.playerState.reputation}/100`, { fontSize: '12px', fill: '#fff', fontFamily: 'monospace' }).setDepth(101);
        this.coinsText = this.scene.add.text(120, 5, `Moedas: ${dataManager.playerState.coins}`, { fontSize: '12px', fill: '#ffd700', fontFamily: 'monospace' }).setDepth(101);

        const levelNames = ["Iniciante", "Intermediário", "Referência", "Lendária"];
        this.levelText = this.scene.add.text(250, 5, `Nvl: ${levelNames[dataManager.playerState.level - 1]}`, { fontSize: '12px', fill: '#aaa', fontFamily: 'monospace' }).setDepth(101);
    }

    updateHUD() {
        if(this.reputationText) {
            this.reputationText.setText(`Rep: ${dataManager.playerState.reputation}/100`);
            this.coinsText.setText(`Moedas: ${dataManager.playerState.coins}`);

            const levelNames = ["Iniciante", "Intermediário", "Referência", "Lendária"];
            this.levelText.setText(`Nvl: ${levelNames[dataManager.playerState.level - 1]}`);
        }
    }

    showToast(message, color = 0x4CAF50) {
        const toastW = 150;
        const toastH = 30;
        const x = this.scene.scale.width / 2 - toastW / 2;
        const y = this.scene.scale.height - toastH - 10;

        const container = this.scene.add.container(x, y).setDepth(200);

        const bg = this.scene.add.graphics();
        bg.fillStyle(color, 0.9);
        bg.fillRoundedRect(0, 0, toastW, toastH, 4);

        const text = this.scene.add.text(toastW/2, toastH/2, message, {
            fontSize: '10px',
            fontFamily: 'monospace',
            fill: '#fff'
        }).setOrigin(0.5);

        container.add([bg, text]);
        container.setAlpha(0);

        this.scene.tweens.add({
            targets: container,
            alpha: 1,
            duration: 200,
            yoyo: true,
            hold: 2000,
            onComplete: () => {
                container.destroy();
            }
        });
    }

    fadeTransition(targetSceneKey, data) {
        this.scene.cameras.main.fadeOut(200, 0, 0, 0);
        this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.scene.start(targetSceneKey, data);
        });
    }
}
