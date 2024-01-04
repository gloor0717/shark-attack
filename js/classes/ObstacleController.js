import Obstacle from "./Obstacle.js";

export default class ObstacleController {
    constructor(ctx, loadedObstacleImages, speed, scaleX, scaleY) {
        this.ctx = ctx; // The canvas context
        this.canvas = ctx.canvas; // The canvas element
        this.loadedObstacleImages = loadedObstacleImages; // Array of loaded obstacle images
        this.speed = speed; // Speed of the obstacles
        this.scaleX = scaleX; // Scale factor for the X-axis
        this.scaleY = scaleY; // Scale factor for the Y-axis

        this.OBSTACLE_INTERVAL_MIN = 300; // Minimum time until the next obstacle
        this.OBSTACLE_INTERVAL_MAX = 2000 ; // Maximum time until the next obstacle

        this.obstacles = []; // Array to store obstacles
        this.nextObstacleInterval = null; // Time until the next obstacle

        console.log("Loaded obstacle images:", loadedObstacleImages);

        this.setNextObstacleTime(); // Initialize the next obstacle interval
    }

    // Set the time until the next obstacle
    setNextObstacleTime() {
        const num = this.getRandomNumber(
            this.OBSTACLE_INTERVAL_MIN,
            this.OBSTACLE_INTERVAL_MAX
        );
        this.nextObstacleInterval = num;
    }

    // Generate a random number within a specified range
    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Create a new obstacle and add it to the obstacles array
    createObstacle() {
        const index = Math.floor(Math.random() * this.loadedObstacleImages.length);
        const obstacleData = this.loadedObstacleImages[index];
        const scaledWidth = obstacleData.width * this.scaleX;
        const scaledHeight = obstacleData.height * this.scaleY;

        const x = this.canvas.width + obstacleData.width;
        const y = obstacleData.position;

        const obstacle = new Obstacle(
            this.ctx,
            x,
            y,
            scaledWidth,
            scaledHeight,
            obstacleData.image,
            obstacleData.position,
            obstacleData.type,
            obstacleData.points
        );

        this.obstacles.push(obstacle);
    }

    // Update the obstacles based on game speed and frame time
    update(gameSpeed, frameTimeDelta) {
        this.obstacles.forEach((obstacle) =>
            obstacle.update(this.speed, gameSpeed, frameTimeDelta)
        );

        if (
            this.nextObstacleInterval <= 0 &&
            this.loadedObstacleImages.length > 0
        ) {
            this.createObstacle(this.loadedObstacleImages[0]); // Example, for the first obstacle
            this.setNextObstacleTime();
        }
        this.nextObstacleInterval -= frameTimeDelta;

        this.obstacles.forEach((obstacle) => {
            obstacle.update(this.speed, gameSpeed, frameTimeDelta);
        });

        this.obstacles = this.obstacles.filter(
            (obstacle) => obstacle.x > -obstacle.width
        );
    }

    // Draw all obstacles on the canvas
    draw() {
        this.obstacles.forEach((obstacle) => obstacle.draw());
    }

    // Check if any obstacle collides with a given sprite
    collideWith(sprite) {
        return this.obstacles.some((obstacle) => obstacle.collideWith(sprite));
    }

    // Reset the list of obstacles
    reset() {
        this.obstacles = [];
    }

    // Get the collided obstacle with a given sprite
    getCollidedObstacle(sprite) {
        return this.obstacles.find((obstacle) => obstacle.collideWith(sprite));
    }
}
