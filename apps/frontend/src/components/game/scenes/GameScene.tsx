import { Socket, io } from 'socket.io-client';
import * as Phaser from 'phaser';
// import Phaser from 'phaser';
import { GAME_OBJECTS, CANVAS_RES, CENTER } from '../Constantsts';
import { Ball } from '../Ball';
import { Paddle } from '../Paddle';

enum GameMode {
    CLASSIC = 'CLASSIC',
    SPECIAL = 'SPECIAL'
}

export class GameScene extends Phaser.Scene {
    private onLoadCallback?: () => void;
    private socket !: Socket;

    // Game objects
    background!: Phaser.GameObjects.Image;

    // Player elements
    paddles!: {
        left: Paddle;
        right: Paddle;
    };
    playerRole: 'player1' | 'player2' | null = null;
    gameId?: string;
    gameMode?: GameMode; // Game mode can be CLASSIC or SPECIAL, etc.

    // Game elements
    ball!: Ball;

    // Game state
    score: {
        left: number;
        right: number;
    } = { left: 0, right: 0 };
    gameState: 'waiting' | 'countdown' | 'playing' | 'gameOver' = 'waiting';

    // UI elements
    scoreDisplay!: {
        left: Phaser.GameObjects.Text;
        right: Phaser.GameObjects.Text;
    };
    text!: Phaser.GameObjects.Text;
    // Network state throttle
    lastSentPaddlePosition: number = 0;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: { socket: Socket, gameId?: string, gameMode?: GameMode, onLoad?: () => void }) {
        console.log(`[GameScene]<init> Initializing with data:${data.socket.id}, gameId: ${data.gameId}, gameMode: ${data.gameMode}`);
        this.socket = data.socket;
        this.gameId = data.gameId;
        this.gameMode = data.gameMode;
        this.onLoadCallback = data.onLoad;

        console.log('[GameScene]<init> Setting up socket events...');
        this.setupSocketEvents();
        console.log('[GameScene]<init> Socket events set up');
    }

    preload() {
        console.log('[GameScene]<preload> Preloading assets...');
        this.load.image('background', 'gameBG4.png');
        this.load.image('ball', 'ball.png');
        this.load.image('paddle', 'paddle.png');
        console.log('[GameScene]<preload> Assets preloaded');
    }

    // Add your scene methods like create(), update(), etc.
    create() {
        console.log('[GameScene]<create> Creating game scene...');

        // Create background and UI elements
        this.background = this.add.image(0, 0, 'background');
        this.background.setDisplaySize(CANVAS_RES.width, CANVAS_RES.height);
        this.background.setOrigin(0, 0);

        // Display waiting message
        this.text = this.add.text(
            CENTER.x,
            CENTER.y,
            'Joining game room...',
            {
                fontSize: GAME_OBJECTS.UI.FONT_SIZE,
                color: '#fff'
            }
        ).setOrigin(0.5);

        // Join the game room
        this.joinGameRoom();

        // Call onLoad to signal that the Phaser scene is created
        if (this.onLoadCallback) {
            this.onLoadCallback();
        }
    }

    private setupSocketEvents() {
        // Player role assignment
        this.socket.on('playerRole', (role: 'player1' | 'player2') => {
            console.log(`You are ${role}`);
            this.playerRole = role;
            this.setupPaddles();
        });

        // Game start event
        this.socket.on('game_start', () => {
            console.log('Game started');
            this.createObjects();
            this.startGame();
        });

        // TODO: implement this
        // Listen for paddle updates from other player
        this.socket.on('paddleUpdate', (data: { role: 'player1' | 'player2', y: number }) => {
            if (this.playerRole === data.role) {
                return; // Don't update your own paddle
            }
            const paddleToUpdate = data.role === 'player1' ? this.paddles.left : this.paddles.right;
            paddleToUpdate.updatePosition(data.y);
        });

        // Listen for ball updates (helps with synchronization)
        // this only runs on player2.
        this.socket.on('ballUpdate', (data: { x: number, y: number, vX: number, vY: number }) => {
            if (this.ball.gameObject) {
                // Only update if deviation is significant
                const distance = Phaser.Math.Distance.Between(
                    this.ball.gameObject.x, this.ball.gameObject.y, data.x, data.y
                );

                if (distance > 20) { // Threshold for correction
                    this.ball.gameObject.setPosition(data.x, data.y);
                    this.ball.gameObject.setVelocity(data.vX, data.vY);
                }
            }
        });

        // Listen for score updates from the server.
        this.socket.on('scoreUpdate', (score: { left: number, right: number }) => {
            this.score = score;
            this.updateScoreDisplay();
            // reset the ball when receiving a score update from the server
            this.ball.reset();
            // TODO: add logic to start round after x time on botrh sides.
            this.startRound();
        });

        // Listen for game over
        this.socket.on('gameOver', (winner: 'left' | 'right') => {
            this.endGame(winner);
        });
    }

    private joinGameRoom() {
        if (!this.gameId || !this.gameMode) {
            console.error("Cannot join game room: missing gameId or gameMode");
            return;
        }

        console.log(`Joining game room: ${this.gameId}, mode: ${this.gameMode}`);
        this.socket.emit('join_game_room', {
            matchId: this.gameId,
            gameMode: this.gameMode
        });

        // Listen for join confirmation
        this.socket.once('join_game_room', (response) => {
            if (response.status === "ok") {
                console.log(`Successfully joined game room: ${this.gameId}`);
                this.text.setText('Waiting for opponent...');
            } else {
                console.error("Failed to join game room:", response.message);
                this.text.setText(`Error: ${response.message}`);
            }
        });
    }

    private setupPaddles() {
        // Create paddles with proper role
        this.paddles = {
            left: new Paddle({
                scene: this,
                startPosX: GAME_OBJECTS.PADDLE.LEFT_PADDLE_POS_X,
                Color: GAME_OBJECTS.PADDLE.LEFT_PADDLE_COLOR,
                cursors: {
                    up: [Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.UP],
                    down: [Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.DOWN],
                    modifier: Phaser.Input.Keyboard.KeyCodes.SHIFT
                },
                controlMode: this.playerRole === 'player1' ? 'local' : 'remote',
                identifier: 'player1'
            }),
            right: new Paddle({
                scene: this,
                startPosX: GAME_OBJECTS.PADDLE.RIGHT_PADDLE_POS_X,
                Color: GAME_OBJECTS.PADDLE.RIGHT_PADDLE_COLOR,
                cursors: {
                    up: [Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.UP],
                    down: [Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.DOWN],
                    modifier: Phaser.Input.Keyboard.KeyCodes.SHIFT
                },
                controlMode: this.playerRole === 'player2' ? 'local' : 'remote',
                identifier: 'player2'
            })
        };
        this.ball = new Ball({
            scene: this,
            paddles: [this.paddles.left, this.paddles.right]
        });

        // Tell server we're ready
        this.socket.emit('ready', { gameId: this.gameId });
    }


    update(time: number) {
        switch (this.gameState) {
            case 'waiting':
                // if both players are ready, start the game
                break;
            case 'countdown':
                // display countdown
                break;
            case 'playing': {
                this.paddles.left.update();
                this.paddles.right.update();
                this.ball.update();

                // Send local paddle position to server (throttled)
                if (time - this.lastSentPaddlePosition > 16) { // ~60 updates per second
                    const myPaddle = this.playerRole === 'player1' ? this.paddles.left : this.paddles.right;
                    if (myPaddle.gameObject) {
                        this.socket.emit('movePaddle', {
                            // gameId: this.gameId,
                            // role: this.playerRole,
                            y: myPaddle.gameObject.y
                        });

                        // If this player is hosting the physics calculation, also send ball position
                        if (this.playerRole === 'player1' && this.ball.gameObject) {
                            this.socket.emit('ballUpdate', {
                                // gameId: this.gameId,
                                x: this.ball.gameObject.x,
                                y: this.ball.gameObject.y,
                                vX: this.ball.gameObject.body.velocity.x,
                                vY: this.ball.gameObject.body.velocity.y
                            });
                        }
                    }
                    this.lastSentPaddlePosition = time;
                }

                break;
            }
            case 'gameOver':
                break;
        }
    }

    createObjects() {
        console.log('Creating paddles...');
        this.paddles.left.create();
        this.paddles.right.create();

        //setup ui
        this.text.destroy();
        this.text = null!;

        const textLable = new Phaser.GameObjects.Text(this, 0, 0, "Player_1 " + 0, { fontSize: GAME_OBJECTS.UI.FONT_SIZE, color: '#fff' });
        this.scoreDisplay = {
            left: this.add.text(
                CENTER.x - (textLable.width + GAME_OBJECTS.UI.MARGIN),
                0,
                'Player 1 ' + this.score.left.toString(),
                {
                    fontSize: GAME_OBJECTS.UI.FONT_SIZE,
                    color: '#fff'
                }),
            right: this.add.text(
                (CENTER.x + GAME_OBJECTS.UI.MARGIN),
                0,
                this.score.right.toString() + ' Player 2',
                {
                    fontSize: GAME_OBJECTS.UI.FONT_SIZE,
                    color: '#fff'
                })
        };
        this.scoreDisplay.left.setAlpha(0.4);
        this.scoreDisplay.right.setAlpha(0.4);

        // start game
        this.startGame();

        this.ball.setCallback((winner) => {
            // Only the hosting player should emit the score point event
            if (this.playerRole === 'player1') {
                this.socket.emit('scorePoint', { winner });
            }
        })

        this.ball.create();
    }

    updateScoreDisplay() {
        this.scoreDisplay.left.setText('Player 1 ' + this.score.left.toString());
        this.scoreDisplay.right.setText(this.score.right.toString() + ' Player 2');
    }

    // gamestate methods
    startGame() {
        this.gameState = 'countdown';
        // this.socket.emit('startGame');
        this.time.delayedCall(1000, () => {
            this.gameState = 'playing';
            if (this.playerRole === 'player1') {
                this.startRound();
                // Tell server round started
                this.socket.emit('roundStarted', {
                    gameId: this.gameId,
                    ballVelocity: {
                        x: this.ball.gameObject?.body.velocity.x,
                        y: this.ball.gameObject?.body.velocity.y
                    }
                });
            }
        });
    }

    startRound() {
        const angle = Phaser.Math.FloatBetween(-Math.PI / 4, Math.PI / 4);
        const direction = Math.random() < 0.5 ? -1 : 1;

        this.ball.gameObject?.setPosition(CENTER.x, CENTER.y);
        this.ball.gameObject?.setVelocity(
            direction * Math.cos(angle) * GAME_OBJECTS.BALL.MIN_SPEED,
            Math.sin(angle) * GAME_OBJECTS.BALL.MIN_SPEED
        );
        this.gameState = 'playing';
    }

    endGame(winner: 'left' | 'right') {
        this.gameState = 'gameOver';

        this.ball.destroy();
        this.paddles.left.destroy();
        this.paddles.right.destroy();
        // this.scoreDisplay.left.destroy();
        // this.scoreDisplay.right.destroy();
        this.add.text(
            CENTER.x,
            CENTER.y,
            `Game Over! ${winner === 'left' ? 'Player 1' : 'Player 2'} wins!`,
            {
                fontSize: GAME_OBJECTS.UI.FONT_SIZE,
                color: '#fff'
            }
        ).setOrigin(0.5);
    }

}
