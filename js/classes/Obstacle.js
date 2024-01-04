export default class Obstacle {
    constructor(
      ctx,
      x,
      y,
      width,
      height,
      image,
      position,
      type = "obstacle",
      points = 0
    ) {
      this.ctx = ctx; // The canvas context
      this.x = x; // X-coordinate of the obstacle
      this.y = y; // Y-coordinate of the obstacle
      this.width = width; // Width of the obstacle
      this.height = height; // Height of the obstacle
      this.image = new Image();
      this.image.src = image;
      this.hit = false;
      this.active = true;
      this.image.onload = () => {
        this.imageLoaded = true; // Set imageLoaded to true once the image has loaded
      };
      this.position = position; // Position
      this.type = type;
      this.points = points;
    }
  
    // Update the position of the obstacle based on game speed and frame time
    update(speed, gameSpeed, frameTimeDelta) {
      this.x -= speed * gameSpeed * frameTimeDelta;
    }
  
    draw() {
      if (this.active) {
        this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      }
    }
  
    // Check if the obstacle collides with another sprite
    collideWith(sprite) {
      const hitbox1 = this.getHitbox();
      const hitbox2 = sprite.getHitbox();
  
      // Check for collision using hitbox coordinates
      return (
        hitbox1.x < hitbox2.x + hitbox2.width &&
        hitbox1.x + hitbox1.width > hitbox2.x &&
        hitbox1.y < hitbox2.y + hitbox2.height &&
        hitbox1.y + hitbox1.height > hitbox2.y
      );
    }
  
    // Get the hitbox of the obstacle with optional padding
    getHitbox() {
      const padding = 0; // Adjust this value to shrink the hitbox
      return {
        x: this.x + padding,
        y: this.y + padding,
        width: this.width - 2 * padding,
        height: this.height - 2 * padding,
      };
    }
  }
  