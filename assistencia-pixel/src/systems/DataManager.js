export class DataManager {
    constructor(scene) {
        this.scene = scene;
        this.models = [];
        this.defects = [];
        this.parts = [];
        this.tools = [];
    }

    loadData() {
        this.models = this.scene.cache.json.get('models');
        this.defects = this.scene.cache.json.get('defects');
        this.parts = this.scene.cache.json.get('parts');
        this.tools = this.scene.cache.json.get('tools');
    }

    getRandomClient(reputationLevel) {
        // Filter models based on reputation
        let availableModels = this.models.filter(m => {
            if (m.category === 'geek' && reputationLevel < 3) return false;
            return true;
        });

        // Pick a random model
        const model = availableModels[Math.floor(Math.random() * availableModels.length)];

        // Get defects compatible with this model
        const availableDefects = this.defects.filter(d => d.categories.includes(model.category));

        // Pick a random defect
        const defect = availableDefects[Math.floor(Math.random() * availableDefects.length)];

        return {
            clientName: "Cliente " + Math.floor(Math.random() * 1000),
            model: model,
            defect: defect,
            reward: defect.minigame === 'soldering' ? 100 : 50
        };
    }

    getDefectsForModel(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) return [];
        return this.defects.filter(d => d.categories.includes(model.category));
    }

    getPart(partId) {
        return this.parts.find(p => p.id === partId);
    }
}
