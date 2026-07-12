import Phaser from 'phaser';
import modelsData from '../data/models.json';
import defectsData from '../data/defects.json';
import partsData from '../data/parts.json';
import toolsData from '../data/tools.json';

class DataManager {
    constructor() {
        this.models = modelsData;
        this.defects = defectsData;
        this.parts = partsData;
        this.tools = toolsData;

        // Player state
        this.playerState = {
            reputation: 50,
            coins: 100,
            inventory: {
                "part_screen": 5,
                "part_battery": 5,
                "part_alcohol": 10,
                "part_chip": 2
            },
            level: 1 // 1: Iniciante, 2: Intermediário, 3: Referência, 4: Lendária
        };

        this.loadProgress();
    }

    loadProgress() {
        const savedState = localStorage.getItem('assistenciaPixel_save');
        if (savedState) {
            try {
                this.playerState = JSON.parse(savedState);
            } catch (e) {
                console.error("Failed to load save state", e);
            }
        }
    }

    saveProgress() {
        localStorage.setItem('assistenciaPixel_save', JSON.stringify(this.playerState));
    }

    addReputation(amount) {
        this.playerState.reputation = Phaser.Math.Clamp(this.playerState.reputation + amount, 0, 100);
        this.updateLevel();
        this.saveProgress();
    }

    addCoins(amount) {
        this.playerState.coins += amount;
        this.saveProgress();
    }

    updateLevel() {
        if (this.playerState.reputation >= 90) this.playerState.level = 4;
        else if (this.playerState.reputation >= 70) this.playerState.level = 3;
        else if (this.playerState.reputation >= 40) this.playerState.level = 2;
        else this.playerState.level = 1;
    }

    // Procedural generation
    getRandomClient() {
        // Filter models by difficulty/reputation level
        const availableModels = this.models.filter(m => m.difficulty <= this.playerState.level * 2);
        const model = availableModels[Math.floor(Math.random() * availableModels.length)] || this.models[0];

        const defect = this.defects[Math.floor(Math.random() * this.defects.length)];

        return {
            id: 'client_' + Date.now(),
            model: model,
            defect: defect,
            status: 'todo' // todo, in_progress, done
        };
    }
}

// Export a singleton instance
export const dataManager = new DataManager();
