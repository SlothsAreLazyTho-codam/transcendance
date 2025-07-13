import { Physics, Scene } from "phaser";
import { GAME_OBJECTS } from "./Constantsts";

interface Options {
    scene: Scene;
    startPosX: number;
    Color: number;
    cursors: CursorKeys;
    controlMode: 'local' | 'remote';
    identifier?: string;
}

interface CursorKeys {
    up: number | number[];
    down: number | number[];
    modifier: number;
}

export class Paddle {
    scene: Scene;
    gameObject?: Phaser.Physics.Arcade.Image;
    StartPosX!: number;
    Color!: number;
    cursorOptions?: CursorKeys;
    controlMode: 'local' | 'remote';
    id?: string;

    key!: {
        up?: Phaser.Input.Keyboard.Key | Phaser.Input.Keyboard.Key[];
        down?: Phaser.Input.Keyboard.Key | Phaser.Input.Keyboard.Key[];
        modifier?: Phaser.Input.Keyboard.Key;
    }

    constructor({ scene, startPosX, Color, cursors, controlMode, identifier }: Options) {
        this.scene = scene;
        this.StartPosX = startPosX;
        this.Color = Color;
        this.cursorOptions = cursors;
        this.controlMode = controlMode;
        this.id = identifier;
    }

    create() {
        this.gameObject = this.scene.physics.add.image(
            this.StartPosX,
            GAME_OBJECTS.PADDLE.POS_Y,
            'paddle'
        );

        this.gameObject.setDisplaySize(
            GAME_OBJECTS.PADDLE.WIDTH,
            GAME_OBJECTS.PADDLE.HEIGHT
        )
        this.gameObject.setTintFill(this.Color);
        // this.gameObject.setImmovable(true);
        this.gameObject.setPushable(false);
        this.gameObject.setCollideWorldBounds(true);

        // Only bind keys if this is a local paddle
        if (this.controlMode === 'local' && this.cursorOptions) {
            this.key = {
                up: this.bindMultipleKeys(this.cursorOptions.up),
                down: this.bindMultipleKeys(this.cursorOptions.down),
                modifier: this.scene.input.keyboard?.addKey(this.cursorOptions.modifier),
            };
        }
    }
    // Helper method to bind multiple keys or a single key
    private bindMultipleKeys(keyCode: number | number[]): Phaser.Input.Keyboard.Key[] | Phaser.Input.Keyboard.Key | undefined {
        if (Array.isArray(keyCode)) {
            return keyCode.map(code => this.scene.input.keyboard?.addKey(code)).filter((key): key is Phaser.Input.Keyboard.Key => key !== undefined);
        }
        return this.scene.input.keyboard?.addKey(keyCode);
    }


    update() {
        if (this.controlMode === 'local' && this.gameObject) {
            const isUpPressed = this.isAnyKeyDown(this.key.up);
            const isDownPressed = this.isAnyKeyDown(this.key.down);

            const isModifierPressed = this.key.modifier?.isDown;
            const speedMultiplier = isModifierPressed ? 2.5 : 1;

            if (isUpPressed) {
                this.gameObject?.setVelocityY(-GAME_OBJECTS.PADDLE.SPEED * speedMultiplier);
            } else if (isDownPressed) {
                this.gameObject?.setVelocityY(GAME_OBJECTS.PADDLE.SPEED * speedMultiplier);
            } else {
                this.gameObject?.setVelocityY(0);
            }
        }
        // Remote paddles are updated via updatePosition method
    }
    // Helper method to check if any key in an array is pressed
    private isAnyKeyDown(key?: Phaser.Input.Keyboard.Key | Phaser.Input.Keyboard.Key[]): boolean {
        if (!key) {
            return false;
        }
        if (Array.isArray(key)) {
            return key.some(k => k?.isDown);
        }
        return key?.isDown;
    }

    destroy() {
        this.gameObject?.destroy();
        this.gameObject = undefined;
    }

    // Method to update position from server data
    updatePosition(y: number) {
        if (this.controlMode === 'remote' && this.gameObject) {
            this.gameObject.setY(y);
        }
    }
    // Optional method to get position data to send to server, possibly not needed
    getPositionData() {
        return {
            id: this.id,
            y: this.gameObject?.y
        };
    }
}
