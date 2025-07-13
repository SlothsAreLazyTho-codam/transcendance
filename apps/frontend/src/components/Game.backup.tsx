import { stringify } from 'node:querystring';
import Phaser, { Time } from 'phaser';


// SCREENSIZES (the game is designed for 800*600 but is scalable)

// const S_WIDTH = 2048;
// const S_HEIGHT = 1536;

// const S_WIDTH = 1600;
// const S_HEIGHT = 1200;

// const S_WIDTH = 1400;
// const S_HEIGHT = 1050;

// const S_WIDTH = 1280;
// const S_HEIGHT = 960;

const S_WIDTH = 1152;
const S_HEIGHT = 864;

// const S_WIDTH = 1024;
// const S_HEIGHT = 768;

// const S_WIDTH = 800;
// const S_HEIGHT = 600;

// const S_WIDTH = 640;
// const S_HEIGHT = 480;


const LEFT_PADDLE_X = S_WIDTH * 0.0625; // 5% van de schermbreedte
const RIGHT_PADDLE_X = S_WIDTH * 0.9375; // 95% van de schermbreedte
const LEFT_GAMEOVER_X = S_WIDTH * 0.05;   // 5% van de schermbreedte (dichter bij de linker rand)
const RIGHT_GAMEOVER_X = S_WIDTH * 0.95;  // 95% van de schermbreedte (dichter bij de rechter rand)
const P_WIDTH = S_WIDTH * 0.001;
const P_HEIGHT = S_HEIGHT * 0.25;


const P_SPEED = S_HEIGHT / 100 * 1.67;

const PADDLE_Y = S_HEIGHT / 2;
const RIGHT_PADDLE_COLOR = 0xff9966;
const LEFT_PADDLE_COLOR = 0xffffff;

const B_SIZE = S_WIDTH * 0.025;


// Dynamische scoreboard X posities symmetrisch ten opzichte van het midden
const MIDDLE_X = S_WIDTH / 2;
const MIDDLE_Y = S_HEIGHT / 2;
const MARGIN = S_WIDTH * 0.05; // 5% van de schermbreedte

const FONT_SIZE = (S_WIDTH * 0.03125).toString() + "px";  // 3.125% van de schermbreedte






interface GameScene extends Phaser.Scene {
  paddle: Phaser.GameObjects.Rectangle;
  secondPaddle: Phaser.GameObjects.Rectangle;
  ball: Phaser.Physics.Arcade.Image;
  scoreleft: number;
  scoreright: number;
  textleft: Phaser.GameObjects.Text;
  textright: Phaser.GameObjects.Text;
  winner: number;
}

class PhaserGame {
  game: Phaser.Game;


  constructor(container: HTMLElement) {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: S_WIDTH,
      height: S_HEIGHT,
      parent: container, // Zet het canvas in dit DOM-element
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: {
        preload: this.preload,
        create: this.create,
        update: this.update
      } as Phaser.Types.Scenes.SettingsConfig // Cast hier naar juiste type
    };

    this.game = new Phaser.Game(config);
  }

  preload(this: GameScene) {
    this.load.image('BG', 'gameBG4.png'); // Achtergrond
    this.load.image('ball', 'ball.png'); // Bal-afbeelding
    console.log('Preloading assets...');
  }

  create(this: GameScene) {
    console.log('Creating game objects...');
    const background = this.add.image(0, 0, 'BG'); // Achtergrond
    background.setOrigin(0, 0);
    background.setDisplaySize(S_WIDTH, S_HEIGHT);
    this.winner = 200;
    this.scoreleft = 0;
    this.scoreright = 0;
    const playerone = new Phaser.GameObjects.Text(this, 0, 0, "Player_1: " + this.scoreleft.toString(), { fontSize: FONT_SIZE, color: '#fff' });

    this.textleft = this.add.text(MIDDLE_X - (playerone.width + MARGIN), 0, this.scoreleft.toString(), { fontSize: FONT_SIZE, color: '#fff' });
    this.textright = this.add.text((MIDDLE_X + MARGIN), 0, this.scoreright.toString(), { fontSize: FONT_SIZE, color: '#fff' });

    this.textleft.setText("Player_1: " + this.scoreleft.toString());
    this.textright.setText(this.scoreright.toString() + " :Player_2");

    this.textleft.setAlpha(0.4);
    this.textright.setAlpha(0.4);

    // Maak de paddles en de bal als scene-eigenschappen
    this.paddle = this.add.rectangle(LEFT_PADDLE_X, PADDLE_Y, P_WIDTH, P_HEIGHT, LEFT_PADDLE_COLOR);
    this.secondPaddle = this.add.rectangle(RIGHT_PADDLE_X, PADDLE_Y, P_WIDTH, P_HEIGHT, RIGHT_PADDLE_COLOR);

    this.ball = this.physics.add.image(MIDDLE_X, MIDDLE_Y, 'ball'); // Maak de bal
    this.ball.setDisplaySize(B_SIZE, B_SIZE);
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(1, 1);
    this.ball.setVelocity(200, 200);

    this.physics.add.existing(this.paddle);
    this.physics.add.existing(this.secondPaddle);

    (this.paddle.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    (this.secondPaddle.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    // Voeg collider toe tussen de bal en de paddles
    this.physics.add.collider(this.ball, this.paddle, () => {
      if (this.ball && this.ball.body) {
        // Pas de nieuwe snelheid toe op de bal
        this.ball.setVelocity(this.ball.body.velocity.x * 1.15, this.ball.body.velocity.y);
      } else {
        console.log('Ball body is not initialized');
      }
    });

    // Voeg collider toe tussen de bal en de tweede paddle
    this.physics.add.collider(this.ball, this.secondPaddle, () => {
      if (this.ball && this.ball.body) {
        // Pas de nieuwe snelheid toe op de bal
        this.ball.setVelocity(this.ball.body.velocity.x * 1.15, this.ball.body.velocity.y);
      } else {
        console.log('Ball body is not initialized');
      }
    });
  }

  update(this: GameScene) {

    // Paddle beweging
    if (this.input.keyboard && this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W), 1)) {
      this.paddle.y -= P_SPEED;
    }
    if (this.input.keyboard && this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S), 1)) {
      this.paddle.y += P_SPEED;
    }

    if (this.input.keyboard && this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP), 1)) {
      this.secondPaddle.y -= P_SPEED;
    }
    if (this.input.keyboard && this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), 1)) {
      this.secondPaddle.y += P_SPEED;
    }

    this.paddle.setPosition(this.paddle.x, this.paddle.y);
    this.secondPaddle.setPosition(this.secondPaddle.x, this.secondPaddle.y);


    // Begrenzing paddles
    if (this.paddle.y < this.paddle.height / 2) this.paddle.y = this.paddle.height / 2;
    if (this.paddle.y > this.scale.height - this.paddle.height / 2) this.paddle.y = this.scale.height - this.paddle.height / 2;

    if (this.secondPaddle.y < this.secondPaddle.height / 2) this.secondPaddle.y = this.secondPaddle.height / 2;
    if (this.secondPaddle.y > this.scale.height - this.secondPaddle.height / 2) this.secondPaddle.y = this.scale.height - this.secondPaddle.height / 2;


    // Reset de balpositie als hij de linker of rechter muur raakt
    if (this.ball.x < LEFT_GAMEOVER_X || this.ball.x > RIGHT_GAMEOVER_X) {
      if (this.ball.x < 49) {
        this.winner = 200;
        // console.log("Player 2 scores!");
        this.scoreright += 1;
        this.textright.setText(this.scoreright.toString() + " :Player_2");
      } else {
        this.winner = -200;
        // console.log("Player 1 scores!");
        this.scoreleft += 1;
        this.textleft.setText("Player_1: " + this.scoreleft.toString());
      }
      this.ball.setPosition(MIDDLE_X, MIDDLE_Y); // Zet de bal terug in het midden
      this.ball.setVelocity(0, 0); // Zet de snelheid weer naar het begin

      this.time.delayedCall(2000, () => {
        this.ball.setVelocity(this.winner, this.winner); // Zet de snelheid weer naar het begin
      });
    }

    if (this.scoreleft == 5) {
      this.ball.setVelocity(0, 0);
      this.add.text(250, 390, "Player_1:" + this.scoreleft.toString() + " - WINNER", { fontSize: FONT_SIZE, color: '#fff' });

    }
    else if (this.scoreright == 5) {
      this.ball.setVelocity(0, 0);
      this.add.text(250, 390, "Player_2:" + this.scoreleft.toString() + " - WINNER", { fontSize: FONT_SIZE, color: '#fff' });
    }

  }


  destroy() {
    this.game.destroy(true); // Verwijder de game instantie en het canvas
  }
}

export default PhaserGame;
