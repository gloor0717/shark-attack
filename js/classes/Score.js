export default class Score {
  // Properties for managing score and high score
  score = 0;
  highScore = 0; // Initialize the highScore property
  HIGH_SCORE_KEY = "highScore";

  constructor(ctx) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.fetchHighScore(); // Fetch the high score when the Score object is created
  }

  // Fetch the high score for a logged-in user
  fetchHighScore() {
    const userToken = localStorage.getItem("userToken");

    // Only proceed if the user is logged in
    if (userToken) {
      fetch("https://shark-cms.gloor.dev/wp-json/wp/v2/user-best-score/", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + userToken,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((bestScore) => {
          // Update the highScore property of the Score class
          this.highScore = bestScore;
          // Optionally, you can update the high score in local storage if needed
          localStorage.setItem(this.HIGH_SCORE_KEY, this.highScore);
        })
        .catch((error) => {
          console.error("Error fetching user best score:", error);
        });
    }
  }

  // Update the score based on frame time delta
  update(frameTimeDelta) {
    this.score += frameTimeDelta * 0.01;
  }

  increaseScore(points) {
    this.score += points;
  }

  // Reset the score to zero
  reset() {
    this.score = 0;
  }

  // Draw the current score and high score on the canvas
  draw() {
    const highScore = this.highScore;
    const y = 20;

    const fontSize = 20;
    this.ctx.font = `${fontSize}px Minecraft`;
    this.ctx.fillStyle = "#515151";
    const scoreX = this.canvas.width - 75;
    const highScoreX = scoreX - 125;

    // Pad the score and high score with leading zeros for formatting
    const scorePadded = Math.floor(this.score).toString().padStart(6, 0);
    const highScorePadded = highScore.toString().padStart(6, 0);

    // Draw the current score and high score on the canvas
    this.ctx.fillText(scorePadded, scoreX, y);
    this.ctx.fillText(`HI ${highScorePadded}`, highScoreX, y);
  }
}
