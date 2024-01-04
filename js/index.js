// Importing required modules and classes
import Player from "./classes/Player.js";
import Ground from "./classes/Ground.js"; 
import ObstacleController from "./classes/ObstacleController.js";
import Score from "./classes/Score.js";

// Function to fetch obstacles from API 
function fetchObstacles() {
    return fetch("https://shark-cms.gloor.dev/wp-json/wp/v2/obstacles")
        .then((response) => response.json())
        .then((data) => {
            return data.map((obstacle) => ({
                width: parseInt(obstacle.acf.width, 10),
                height: parseInt(obstacle.acf.height, 10),
                image: obstacle.acf.image,
                type: obstacle.acf.type.toLowerCase(),
                points: obstacle.acf.points ? parseInt(obstacle.acf.points, 10) : 0,
                position: obstacle.acf.position * newHeight,
            }));
        });
}

// Initializing canvas and its context
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Original game aspect ratio
const originalWidth = 1920;
const originalHeight = 1080;
const aspectRatio = originalWidth / originalHeight;

// Determine new canvas dimensions
let newWidth, newHeight;
let isPaused = false;

// Check if the window aspect ratio is wider than the game's aspect ratio
if (window.innerWidth / window.innerHeight > aspectRatio) {
    // Window is wider than the game's aspect ratio, so match the height
    newHeight = window.innerHeight;
    newWidth = newHeight * aspectRatio;
} else {
    // Window is narrower, so match the width
    newWidth = window.innerWidth;
    newHeight = newWidth / aspectRatio;
}

const scaleX = newWidth / originalWidth;
const scaleY = newHeight / originalHeight;

const backgroundMusic = new Audio("./assets/audio/CoralLobby.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const GAME_SPEED_START = 1;
const GAME_SPEED_INCREMENT = 0.00001;
const MAX_GAME_SPEED = 5;

const GAME_WIDTH = window.innerWidth;
const PLAYER_WIDTH = 150 * scaleX;
const PLAYER_HEIGHT = 100 * scaleY;
const MAX_JUMP_HEIGHT = newHeight;
const MIN_JUMP_HEIGHT = newHeight;
const MIN_DIVE_HEIGHT = 100 * scaleY;
const MAX_DIVE_HEIGHT = 100 * scaleY;
const GROUND_WIDTH = GAME_WIDTH * 3;
const GROUND_HEIGHT = 24;
const GROUND_AND_OBSTACLE_SPEED = 0.3;

let player = null;
let ground = null;
let obstacleController = null;
let score = null;

let previousTime = null;
let gameSpeed = GAME_SPEED_START;
let gameOver = false;
let hasAddedEventListenersForRestart = false;
let waitingToStart = true;

// Function to create player, ground, obstacle controller, and score objects
function createSprites(obstacleData) {
    const playerWidthInGame = PLAYER_WIDTH;
    const playerHeightInGame = PLAYER_HEIGHT;
    const minJumpHeightInGame = MIN_JUMP_HEIGHT;
    const maxJumpHeightInGame = MAX_JUMP_HEIGHT;
    const minDiveHeightInGame = MIN_DIVE_HEIGHT;
    const maxDiveHeightInGame = MAX_DIVE_HEIGHT;

    const groundWidthInGame = GROUND_WIDTH * scaleX;
    const groundHeightInGame = GROUND_HEIGHT * scaleY;

    player = new Player(
        ctx,
        playerWidthInGame,
        playerHeightInGame,
        minJumpHeightInGame,
        maxJumpHeightInGame,
        minDiveHeightInGame,
        maxDiveHeightInGame
    );

    ground = new Ground(
        ctx,
        groundWidthInGame,
        groundHeightInGame,
        GROUND_AND_OBSTACLE_SPEED
    );

    obstacleController = new ObstacleController(
        ctx,
        obstacleData,
        GROUND_AND_OBSTACLE_SPEED,
        scaleX,
        scaleY
    );
    
    score = new Score(ctx);
}

// Function to set the screen dimensions and start the game
function setScreen() {
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    canvas.width = newWidth;
    canvas.height = newHeight;
    ground = new Ground(
        ctx,
        GROUND_WIDTH,
        GROUND_HEIGHT,
        GROUND_AND_OBSTACLE_SPEED
    );
    player = new Player(
        ctx,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        MIN_JUMP_HEIGHT,
        MAX_JUMP_HEIGHT,
        MIN_DIVE_HEIGHT,
        MAX_DIVE_HEIGHT
    );
    backgroundMusic.play();

    fetchObstacles()
        .then((obstacleData) => {
            createSprites(obstacleData);
            startGameLoop();
        })
        .catch((error) => {
            console.error("Error loading obstacles: ", error);
        });
}

// Function to start the game loop
function startGameLoop() {
    if (ground.groundImage.complete && player.spriteSheet.complete) {
        requestAnimationFrame(gameLoop);
    } else {
        ground.groundImage.onload = () => requestAnimationFrame(gameLoop);
        player.spriteSheet.onload = () => requestAnimationFrame(gameLoop);
    }
}

// Function to show the game over screen
function showGameOver() {
    localStorage.setItem("lastScore", Math.floor(score.score));
    window.location.href = "gameover.html";
}

// Function to setup game reset event listeners
function setupGameReset() {
    if (!hasAddedEventListenersForRestart) {
        hasAddedEventListenersForRestart = true;

        setTimeout(() => {
            window.addEventListener("keyup", reset, { once: true });
            window.addEventListener("touchstart", reset, { once: true });
        }, 1000);
    }
}

// Function to reset the game
function reset() {
    hasAddedEventListenersForRestart = false;
    gameOver = false;
    waitingToStart = false;
    ground.reset();
    obstacleController.reset();
    score.reset();
    gameSpeed = GAME_SPEED_START;
}

// Function to show the start game text
function showStartGameText() {
    const fontSize = 60 * scaleX;
    ctx.font = `${fontSize}px Minecraft`;
    ctx.fillStyle = "grey";

    const text = "Press any key to start";
    const text2 = "Use the space bar or W or arrow up to jump";
    const text3 = "Use the S or arrow down to dive";
    const text4 = "Seagulls and Fishes are bonus points";
    const text5 = "All other obstacles are game over";

    const textWidth = ctx.measureText(text).width;
    const textX = 40 * scaleX;
    const textY = 100 * scaleY;

    ctx.fillText(text, textX, textY);
    ctx.fillText(text2, textX, textY + 100 * scaleY);
    ctx.fillText(text3, textX, textY + 200 * scaleY);
    ctx.fillText(text4, textX, textY + 300 * scaleY);
    ctx.fillText(text5, textX, textY + 400 * scaleY);
}

// Function to update the game speed based on frame time delta
function updateGameSpeed(frameTimeDelta) {
    gameSpeed += frameTimeDelta * GAME_SPEED_INCREMENT;
    gameSpeed = Math.min(gameSpeed, MAX_GAME_SPEED);
}

// Function to clear the screen
function clearScreen() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Event listeners for pausing the game when window loses focus or is resized
window.addEventListener("blur", () => {
    isPaused = true;
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        isPaused = true;
    }
});

window.addEventListener("resize", () => {
    isPaused = true;
});

// Main game loop
function gameLoop(currentTime) {
    if (isPaused) {
        showPauseScreen();
        return;
    }

    if (previousTime === null) {
        previousTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }

    const frameTimeDelta = currentTime - previousTime;
    previousTime = currentTime;

    clearScreen();

    if (!gameOver && !waitingToStart) {
        if (ground) {
            ground.update(gameSpeed, frameTimeDelta);
            ground.draw();
        }

        if (player) {
            player.update(gameSpeed, frameTimeDelta);
            player.draw();
        }

        if (obstacleController) {
            obstacleController.update(gameSpeed, frameTimeDelta);
            obstacleController.draw();
        }

        score.update(frameTimeDelta);
        score.draw();

        updateGameSpeed(frameTimeDelta);

        if (
            !gameOver &&
            obstacleController &&
            player &&
            obstacleController.collideWith(player)
        ) {
            const collidedObstacle = obstacleController.getCollidedObstacle(player);

            if (collidedObstacle && !collidedObstacle.hit) {
                collidedObstacle.hit = true;
                collidedObstacle.active = false;

                if (collidedObstacle.type === "bonus") {
                    const bonusSound = new Audio("./assets/audio/Crunch.mp3");
                    bonusSound.volume = 0.3;
                    bonusSound.play();
                    score.increaseScore(collidedObstacle.points);
                } else {
                    gameOver = true;
                    setupGameReset();
                }
            }
        }
    }

    if (gameOver) {
        showGameOver();
    }

    if (waitingToStart) {
        showStartGameText();
    }

    // Function to show the pause screen
    function showPauseScreen() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const fontSize = 60 * scaleX;
        ctx.font = `${fontSize}px Minecraft`;
        ctx.fillStyle = "white";
        ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(gameLoop);
}

setScreen();

// Event listener for pausing the game
window.addEventListener("keyup", (event) => {
    if (event.code === "Escape" || event.code === "KeyP") {
        isPaused = !isPaused;
        if (!isPaused) {
            previousTime = null;
            requestAnimationFrame(gameLoop);
        }
    }
});

// Check if the window width is less than 600px
if (window.innerWidth < 600) {
    const sorryMessage = document.createElement("div");
    sorryMessage.style.width = "100vw";
    sorryMessage.style.height = "100vh";
    sorryMessage.style.backgroundColor = "black";
    sorryMessage.style.position = "absolute";
    sorryMessage.style.top = "50%";
    sorryMessage.style.left = "50%";
    sorryMessage.style.transform = "translate(-50%, -50%)";
    sorryMessage.style.fontSize = "2rem";
    sorryMessage.style.fontFamily = "Minecraft";
    sorryMessage.style.color = "white";
    sorryMessage.style.textAlign = "center";
    sorryMessage.style.zIndex = "100";
    sorryMessage.style.marginTop = "200px";
    sorryMessage.innerHTML = "Sorry, this game is not playable on mobile.";
    document.body.appendChild(sorryMessage);
    isPaused = true;
    setTimeout(() => {
        window.location.href = "index.html";
    }, 5000);
}

// Event listener for resizing the window
window.addEventListener("resize", () => {
    if (window.innerWidth / window.innerHeight > aspectRatio) {
        newHeight = window.innerHeight;
        newWidth = newHeight * aspectRatio;
    } else {
        newWidth = window.innerWidth;
        newHeight = newWidth / aspectRatio;
    }

    setScreen();
    isPaused = true;
});

requestAnimationFrame(gameLoop);

window.addEventListener("keyup", reset, { once: true });
window.addEventListener("touchstart", reset, { once: true });
