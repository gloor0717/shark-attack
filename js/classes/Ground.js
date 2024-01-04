export default class Ground {
    constructor(context, width, height, speed) {
        this.context = context;
        this.canvas = context.canvas;
        this.width = width;
        this.height = height;
        this.speed = speed;

        this.xPosition = 0;
        this.yPosition = this.canvas.height / 2 + this.height;

        this.groundImage = new Image();
        this.isGroundImageLoaded = false;
        this.fetchGroundImage();
    }

    // Fetches the ground image from a remote server
    async fetchGroundImage() {
        const imageUrl = "https://shark-cms.gloor.dev/wp-json/wp/v2/pages/20";
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.groundImage.src = data.acf.ground_image;
            this.groundImage.onload = () => {
                this.isGroundImageLoaded = true;
            };
        } catch (error) {
            console.error("Failed to load ground image:", error);
            this.groundImage.src = "assets/images/background/sea.png";  // Fallback image
        }
    }

    // Updates the position of the ground based on game speed and frame time
    update(gameSpeed, frameTimeDelta) {
        // Movement logic based on game speed and frame time
        this.xPosition -= gameSpeed * frameTimeDelta * this.speed;
    }

    // Draws the ground on the canvas
    draw() {
        // Only draws the ground if the image is loaded
        if (this.isGroundImageLoaded) {
            this.context.drawImage(
                this.groundImage,
                this.xPosition,
                this.yPosition,
                this.width,
                this.height
            );

            // Drawing the ground again to create a seamless loop effect
            this.context.drawImage(
                this.groundImage,
                this.xPosition + this.width,
                this.yPosition,
                this.width,
                this.height
            );

            // Resetting position for seamless looping
            if (this.xPosition < -this.width) {
                this.xPosition = 0;
            }
        }
    }

    // Resets the position of the ground to the initial state
    reset() {
        this.xPosition = 0;  // Resetting to initial x position
    }
}
