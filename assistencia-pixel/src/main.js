import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { WorkshopScene } from './scenes/WorkshopScene';
import { DiagnosisScene } from './scenes/DiagnosisScene';
import { RepairScene } from './scenes/RepairScene';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, PreloadScene, MenuScene, WorkshopScene, DiagnosisScene, RepairScene]
};

const game = new Phaser.Game(config);
