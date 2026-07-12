import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { WorkshopScene } from './scenes/WorkshopScene';
import { DiagnosisScene } from './scenes/DiagnosisScene';
import { RepairScene } from './scenes/RepairScene';

const config = {
    type: Phaser.WEBGL, // Prioritize WebGL with Canvas fallback via AUTO if not supported, but explicit WEBGL per request
    parent: 'game-container',
    width: 384,
    height: 216,
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, PreloadScene, MenuScene, WorkshopScene, DiagnosisScene, RepairScene]
};

const game = new Phaser.Game(config);
