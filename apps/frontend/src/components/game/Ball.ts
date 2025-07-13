import { Scene } from "phaser";
import { CENTER } from "./Constantsts";
import { Paddle } from "./Paddle";

type PaddleTuple = [Paddle, Paddle];

interface Options {
    scene: Scene;
    paddles: PaddleTuple;
}

export class Ball {
    scene: Scene;
    paddles: PaddleTuple;

    gameObject?: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    constructor({ scene, paddles }: Options) {
        this.scene = scene;
        this.paddles = paddles;
    }

    setCallback(onCollideWithWorldBound: (winner: "left" | "right") => void) {
        this.scene.physics.world.on(
            Phaser.Physics.Arcade.Events.WORLD_BOUNDS,
            (
                body: Phaser.Physics.Arcade.Body,
                _up: boolean,
                _down: boolean,
                left: boolean,
                right: boolean
            ) => {
                if (body.gameObject !== this.gameObject) {
                    return;
                }

                if (right || left) {
                    // destroy the ball
                    this.gameObject.setVisible(false);
                    //  callback
                    onCollideWithWorldBound(left ? "right" : "left");
                }
            }
        );
    }

    create() {
        this.gameObject = this.scene.physics.add.image(
            CENTER.x,
            CENTER.y,
            'ball'
        )
        this.gameObject.setCollideWorldBounds(true);
        this.gameObject.setBounce(1);

        this.paddles.forEach((paddle) => {
            if (this.gameObject && paddle.gameObject) {
                this.scene.physics.add.collider(this.gameObject, paddle.gameObject, () => {
                    this.gameObject?.setVelocityX(Math.min(this.gameObject.body.velocity.x * 1.1, 2000));
                    this.gameObject?.setVelocityY(this.gameObject.body.velocity.y);

                    // randomness with y velocity, disabled for now due to sync testing
                    // const randomY = this.gameObject!.body.velocity.y + Math.random() * 200 - 100;
                    // this.gameObject?.setVelocityY(randomY);
                });
            }
        });

        this.gameObject.body.onWorldBounds = true;
    }

    update() { }

    // to be called when recieving data from server
    updatePosition(x: number, y: number, vX: number, vY: number) {
        if (this.gameObject) {
            // Only make big corrections to avoid jitter
            const distance = Phaser.Math.Distance.Between(
                this.gameObject.x, this.gameObject.y, x, y
            );
            
            if (distance > 20) {
                this.gameObject.setPosition(x, y);
                this.gameObject.setVelocity(vX, vY);
            }
        }
    }

    reset() {
        if (this.gameObject) {
            this.gameObject.setPosition(CENTER.x, CENTER.y);
            this.gameObject.setVelocity(0, 0);
            this.gameObject.setVisible(true);
        }
    }

    destroy() {
        this.gameObject?.destroy();
        this.gameObject = undefined;
    }
}

type GameState = any;
