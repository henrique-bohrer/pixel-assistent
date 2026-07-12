export class ProgressionManager {
    constructor() {
        this.reputation = 0;
        this.coins = 0;
        this.level = 0; // 0: Iniciante, 1: Intermediário, 2: Referência, 3: Lendária
        this.inventory = {
            parts: {}, // e.g., 'screen_generic': 2
            tools: ['screwdriver_basic', 'multimeter_basic', 'soldering_iron', 'brush_anti_static']
        };
        this.load();
    }

    save() {
        const data = {
            reputation: this.reputation,
            coins: this.coins,
            level: this.level,
            inventory: this.inventory
        };
        localStorage.setItem('assistencia_pixel_save', JSON.stringify(data));
    }

    load() {
        const data = localStorage.getItem('assistencia_pixel_save');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.reputation = parsed.reputation || 0;
                this.coins = parsed.coins || 0;
                this.level = parsed.level || 0;
                this.inventory = parsed.inventory || { parts: {}, tools: ['screwdriver_basic', 'multimeter_basic', 'soldering_iron', 'brush_anti_static'] };
            } catch (e) {
                console.error("Failed to parse save data:", e);
            }
        }
    }

    addReputation(amount) {
        this.reputation += amount;
        if (this.reputation < 0) this.reputation = 0;
        if (this.reputation > 100) this.reputation = 100;
        this.updateLevel();
        this.save();
    }

    addCoins(amount) {
        this.coins += amount;
        if (this.coins < 0) this.coins = 0;
        this.save();
    }

    updateLevel() {
        if (this.reputation >= 80) this.level = 3;
        else if (this.reputation >= 50) this.level = 2;
        else if (this.reputation >= 20) this.level = 1;
        else this.level = 0;
    }

    hasTool(toolId) {
        return this.inventory.tools.includes(toolId);
    }

    getPartCount(partId) {
        return this.inventory.parts[partId] || 0;
    }

    consumePart(partId) {
        if (this.getPartCount(partId) > 0) {
            this.inventory.parts[partId]--;
            this.save();
            return true;
        }
        return false;
    }
}
