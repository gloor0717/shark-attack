export default class Player {
  // Constants for animation and gameplay
  WALK_ANIMATION_TIMER = 50;
  JUMP_SPEED = 0.6;
  DIVE_SPEED = 0.6; 
  GRAVITY = 0.4;
  MAX_JUMP_SPEED = 2;
  MAX_DIVE_SPEED = 2;
  MAX_GRAVITY = 0.8;
  spriteSheetLoaded = false; // Property to track if the sprite sheet is loaded

  //Sounds for player
  jumpSound = new Audio("../assets/audio/jumpSound.mp3");
  diveSound = new Audio("../assets/audio/Dive.mp3");

  // Properties for player state
  walkAnimationTimer = this.WALK_ANIMATION_TIMER;
  jumpPressed = false;
  divePressed = false;
  jumpInProgress = false;
  diveInProgress = false;
  falling = false;
  goingUp = false;

  constructor(
    ctx,
    width,
    height,
    minJumpHeight,
    maxJumpHeight,
    minDiveHeight,
    maxDiveHeight
  ) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.width = width;
    this.height = height;
    this.minJumpHeight = minJumpHeight;
    this.maxJumpHeight = maxJumpHeight;
    this.minDiveHeight = minDiveHeight;
    this.maxDiveHeight = maxDiveHeight;
    this.baseJumpSpeed = 0.6;
    this.baseDiveSpeed = 0.6;
    this.baseGravity = 0.4;
    this.baseRecoverySpeed = 0.4;

    this.JUMP_SPEED = this.baseJumpSpeed;
    this.DIVE_SPEED = this.baseDiveSpeed;
    this.GRAVITY = this.baseGravity;

    this.x = 10;
    this.y = this.canvas.height / 2 - this.height / 30;
    this.yStandingPosition = this.y;

    // Load the sprite sheet
    this.spriteSheet = new Image();
    this.spriteSheet.onload = () => {
      this.spriteSheetLoaded = true;
    };
    this.spriteSheet.src = "../assets/images/shark/shark_spritesheet.png";

    // Frame dimensions
    this.frameWidth = 194;
    this.frameHeight = 116;
    this.totalFrames = 4;
    this.currentFrame = 0;

    // Register event listeners for keyboard and touch input
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("keyup", this.keyup);
    window.removeEventListener("touchstart", this.touchstart);
    window.removeEventListener("touchend", this.touchend);

    window.addEventListener("keydown", this.keydown);
    window.addEventListener("keyup", this.keyup);
    window.addEventListener("touchstart", this.touchstart);
    window.addEventListener("touchend", this.touchend);

    this.jumpSound.load();
    this.diveSound.load();
  }

  // Handle touch start event
  touchstart = () => {
    this.jumpPressed = true;
  };

  // Handle touch end event
  touchend = () => {
    this.jumpPressed = false;
  };

  // Handle keydown event
  keydown = (event) => {
    if (
      event.code === "Space" ||
      event.code === "ArrowUp" ||
      event.code === "KeyW"
    ) {
      this.jumpPressed = true;
    } else if (event.code === "ArrowDown" || event.code === "KeyS") {
      this.divePressed = true;
    }
  };

  // Handle keyup event
  keyup = (event) => {
    if (
      event.code === "Space" ||
      event.code === "ArrowUp" ||
      event.code === "KeyW"
    ) {
      this.jumpPressed = false;
    }
    if (event.code === "ArrowDown" || event.code === "KeyS") {
      this.divePressed = false;
    }
  };

  // Handle player jump logic
  // Handle player jump logic
  jump(frameTimeDelta) {
    if (this.jumpPressed && !this.jumpInProgress && !this.falling) {
      this.jumpInProgress = true;
      this.goingDown = false;
      this.playJumpSound();
    }

    if (this.jumpInProgress && !this.goingDown) {
      // Adjust the jump condition here
      if (this.y > this.canvas.height - this.maxJumpHeight) {
        this.y -= this.JUMP_SPEED * frameTimeDelta;
      } else {
        this.goingDown = true;
      }
    } else {
      // Falling logic
      if (this.y < this.yStandingPosition) {
        this.y += this.GRAVITY * frameTimeDelta;
        if (this.y >= this.yStandingPosition) {
          this.y = this.yStandingPosition;
          this.jumpInProgress = false;
        }
      }
    }
  }

  // Get the hitbox of the player
  getHitbox() {
    const padding = 0; // Adjust as needed
    return {
      x: this.x + padding,
      y: this.y + padding,
      width: this.width - 2 * padding,
      height: this.height - 2 * padding,
    };
  }

  // Handle player dive logic
  dive(frameTimeDelta) {
    if (this.divePressed) {
      this.diveInProgress = true;
      this.playDiveSound();
    }

    if (this.diveInProgress && !this.goingUp) {
      if (
        this.y < this.canvas.height - this.minDiveHeight ||
        (this.y < this.canvas.height - this.maxDiveHeight && this.divePressed)
      ) {
        this.y += this.DIVE_SPEED * frameTimeDelta;
      } else {
        this.goingUp = true;
      }
    } else {
      if (this.y > this.yStandingPosition) {
        this.y -= this.GRAVITY * frameTimeDelta;
        if (this.y < this.yStandingPosition) {
          this.y = this.yStandingPosition;
        }
      } else {
        this.goingUp = false;
        this.diveInProgress = false;
      }
    }
  }

  // Method to play jump sound
  playJumpSound() {
    this.jumpSound.currentTime = 0; // Reset sound to the start
    this.jumpSound.volume = 0.3;
    this.jumpSound.play();
  }

  // Method to play dive sound
  playDiveSound() {
    this.diveSound.currentTime = 0;
    this.diveSound.volume = 0.3;
    this.diveSound.play();
  }

  // Update player state
  update(gameSpeed, frameTimeDelta) {
    this.updateSpeedBasedOnGameProgress(gameSpeed);
    this.swim(gameSpeed, frameTimeDelta);

    if (!this.jumpInProgress) {
      this.dive(frameTimeDelta);
    }

    if (!this.diveInProgress) {
      this.jump(frameTimeDelta);
    }
  }

  // Update player speeds based on game progress
  updateSpeedBasedOnGameProgress(gameSpeed) {
    this.JUMP_SPEED = Math.min(
      this.baseJumpSpeed * gameSpeed,
      this.MAX_JUMP_SPEED
    );
    this.DIVE_SPEED = Math.min(
      this.baseDiveSpeed * gameSpeed,
      this.MAX_DIVE_SPEED
    );
    this.GRAVITY = Math.min(this.baseGravity * gameSpeed, this.MAX_GRAVITY);
  }

  // Handle swimming animation
  swim(frameTimeDelta) {
    if (this.walkAnimationTimer <= 0) {
      this.walkAnimationTimer = this.WALK_ANIMATION_TIMER;
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    } else {
      this.walkAnimationTimer -= frameTimeDelta;
    }
  }

  // Draw the player on the canvas
  draw() {
    if (this.spriteSheetLoaded) {
      // Only draw if the sprite sheet is loaded
      const frameX = this.currentFrame * this.frameWidth;

      this.ctx.drawImage(
        this.spriteSheet, // Image source
        frameX,
        0, // Source X, Y (top left corner of the frame)
        this.frameWidth,
        this.frameHeight, // Source width and height (frame size)
        this.x,
        this.y, // Destination X, Y (where on the canvas to draw)
        this.width,
        this.height // Destination width and height (how big to draw)
      );
    }
  }
}
