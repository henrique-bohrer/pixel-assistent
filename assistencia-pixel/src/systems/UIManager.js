export class UIManager {
    constructor(scene, progressionManager) {
        this.scene = scene;
        this.progressionManager = progressionManager;
        this.hudGroup = this.scene.add.group();
        this.toasts = [];
        this.createHUD();
    }

    createHUD() {
        // Simple background bar for HUD
        const bg = this.scene.add.rectangle(0, 0, this.scene.cameras.main.width, 24, 0x222222).setOrigin(0, 0);
        this.hudGroup.add(bg);

        // Reputation text
        this.repText = this.scene.add.text(10, 4, `Rep: ${this.progressionManager.reputation}/100`, {
            fontSize: '10px',
            fill: '#fff',
            fontFamily: 'monospace'
        });
        this.hudGroup.add(this.repText);

        // Coins text
        this.coinsText = this.scene.add.text(100, 4, `Moedas: ${this.progressionManager.coins}`, {
            fontSize: '10px',
            fill: '#fff',
            fontFamily: 'monospace'
        });
        this.hudGroup.add(this.coinsText);

        // Level text
        const levels = ["Iniciante", "Intermediário", "Referência", "Lendária"];
        this.levelText = this.scene.add.text(190, 4, `Nível: ${levels[this.progressionManager.level]}`, {
            fontSize: '10px',
            fill: '#fff',
            fontFamily: 'monospace'
        });
        this.hudGroup.add(this.levelText);

        // Fix to camera so it doesn't move if we add scrolling later
        this.hudGroup.setDepth(100);
    }

    updateHUD() {
        this.repText.setText(`Rep: ${this.progressionManager.reputation}/100`);
        this.coinsText.setText(`Moedas: ${this.progressionManager.coins}`);
        const levels = ["Iniciante", "Intermediário", "Referência", "Lendária"];
        this.levelText.setText(`Nível: ${levels[this.progressionManager.level]}`);
    }

    showToast(message) {
        // Create a simple toast notification
        const toastWidth = 150;
        const toastHeight = 30;
        const startY = -toastHeight;
        const targetY = 30;

        const container = this.scene.add.container(this.scene.cameras.main.width / 2, startY);
        container.setDepth(101);

        const bg = this.scene.add.rectangle(0, 0, toastWidth, toastHeight, 0x000000, 0.8);
        bg.setStrokeStyle(1, 0xffffff);

        const text = this.scene.add.text(0, 0, message, {
            fontSize: '10px',
            fill: '#fff',
            fontFamily: 'monospace',
            align: 'center',
            wordWrap: { width: toastWidth - 10 }
        }).setOrigin(0.5);

        container.add([bg, text]);

        // Slide in
        this.scene.tweens.add({
            targets: container,
            y: targetY,
            duration: 300,
            ease: 'Power2',
            yoyo: true,
            hold: 2000, // hold for 2 seconds
            onComplete: () => {
                container.destroy();
            }
        });
    }

    fadeIn(duration = 300, callback = null) {
        this.scene.cameras.main.fadeIn(duration, 0, 0, 0, (camera, progress) => {
            if (progress === 1 && callback) callback();
        });
    }

    fadeOut(duration = 300, callback = null) {
        this.scene.cameras.main.fadeOut(duration, 0, 0, 0, (camera, progress) => {
            if (progress === 1 && callback) callback();
        });
    }
}
