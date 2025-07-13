// Define available game resolutions
export const RESOLUTIONS = [
  { width: 2048, height: 1536, name: '2048×1536' },
  { width: 1600, height: 1200, name: '1600×1200' },
  { width: 1400, height: 1050, name: '1400×1050' },
  { width: 1280, height: 960, name: '1280×960' },
  { width: 1152, height: 864, name: '1152×864' }, // Default
  { width: 1024, height: 768, name: '1024×768' },
  { width: 800, height: 600, name: '800×600' },
  { width: 640, height: 480, name: '640×480' },
];

export const CANVAS_RES = RESOLUTIONS[4]; // change this to the desired resolution

// Constants needed for both game setup and scene
const MIDDLE_X = CANVAS_RES.width / 2;
const MIDDLE_Y = CANVAS_RES.height / 2;
export const CENTER = { x: MIDDLE_X, y: MIDDLE_Y };

// Game config related constants
export const GAME_CONFIG = {
  width: CANVAS_RES.width,
  height: CANVAS_RES.height,
  // Add any other game config constants here
};

// Scene specific constants - consider moving these to GameScene.ts
export const GAME_OBJECTS = {
  PADDLE: {
    WIDTH: CANVAS_RES.width * 0.001,
    HEIGHT: CANVAS_RES.height * 0.20,
    LEFT_PADDLE_POS_X: CANVAS_RES.width * 0.0625,
    RIGHT_PADDLE_POS_X: CANVAS_RES.width * 0.9375,
    POS_Y: CANVAS_RES.height * 0.3,
    SPEED: CANVAS_RES.height / 100 * 27.27, // 1.67
    LEFT_PADDLE_COLOR: 0xffffff,
    RIGHT_PADDLE_COLOR: 0xff9966,
  },
  BALL: {
    SIZE: CANVAS_RES.width * 0.025,
    MAX_SPEED: 2000,
    MIN_SPEED: 200,
  },
  UI: {
    LEFT_OUT_OF_BOUNDS: CANVAS_RES.width * 0.05,
    RIGHT_OUT_OF_BOUNDS: CANVAS_RES.width * 0.95,
    MARGIN: CANVAS_RES.width * 0.05,
    FONT_SIZE: `${CANVAS_RES.width * 0.03125}px`,
  }
};
