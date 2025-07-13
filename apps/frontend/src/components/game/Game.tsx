import { Socket, io } from 'socket.io-client';
import * as Phaser from 'phaser';
import { GAME_CONFIG} from './Constantsts';
import { GameScene } from './scenes/GameScene';

enum GameMode {
    CLASSIC = 'CLASSIC',
    SPECIAL = 'SPECIAL'
}

interface GameParams {
  matchId: string;
  gameMode: GameMode;
}

class PhaserGame {
    game: Phaser.Game;
    socket: Socket;
    gameParams: GameParams;

    constructor(container: HTMLElement, socket: Socket, onLoad: () => void, gameParams: GameParams) {
        console.log('Creating game...');
        this.socket = socket;
        this.gameParams = gameParams;

        // this.socket = tsocket;
        console.log('game config', GAME_CONFIG);
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: GAME_CONFIG.width,
            height: GAME_CONFIG.height,
            scale: {
                mode: Phaser.Scale.ScaleModes.NONE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: GAME_CONFIG.width,
                height: GAME_CONFIG.height,
            },
            parent: container,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false,
                },
            },
            antialias: true,
            fps: {
                target: 60,
                min: 60
            },
            scene: [], // leave empty as cant figure out how to pass data to scene Direclty through config
        };
        this.game = new Phaser.Game(config);

        // Add scene with data
        this.game.scene.add('GameScene', GameScene, true, { 
            socket: this.socket,
            gameId: this.gameParams.matchId,
            gameMode: this.gameParams.gameMode,
            onLoad: onLoad,
        });
        
        console.log('Game created with params:', this.gameParams);

    }

    destroy() {
        this.game.destroy(true);
    }
}
export default PhaserGame
