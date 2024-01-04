document
  .getElementById("registerForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("newUsername").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!isPasswordValid(password)) {
      let error = "";
      if (password.length < 6) {
        error += "Password must be at least 6 characters long. <br>";
      }

      if (!/[A-Z]/.test(password)) {
        error += "Password must contain at least one uppercase letter. <br>";
      }

      if (!/[a-z]/.test(password)) {
        error += "Password must contain at least one lowercase letter. <br>";
      }

      if (!/\d/.test(password)) {
        error += "Password must contain at least one number. <br>";
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        error += "Password must contain at least one special character. <br>";
      }
      displayError(error);
      return;
    }

    if (password !== confirmPassword) {
      displayError("Passwords do not match.");
      return;
    }

    // Check if username or email already exists
    checkUserExists(username, email)
      .then((exists) => {
        if (exists.username) {
          displayError("Username already in use.");
          return;
        }
        if (exists.email) {
          displayError("Email already in use.");
          return;
        }

        // If username and email are unique, register the user
        registerUser(username, email, password);
      })
      .catch((error) => {
        console.error("Error:", error);
        displayError("Error during registration process.");
      });
  });

function isPasswordValid(password) {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>+]/.test(password);
  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
}

function displayError(message) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = message;
  //Interpret HTML tags in message
  errorContainer.innerHTML = message;
  errorContainer.style.display = "block";
}

function checkUserExists(username, email) {
  return fetch(
    `https://shark-cms.gloor.dev/wp-json/wp/v2/users/?search=${username}&search_columns=username`
  )
    .then((response) => response.json())
    .then((data) => {
      const userExists = data.length > 0;
      return fetch(
        `https://shark-cms.gloor.dev/wp-json/wp/v2/users/?search=${email}&search_columns=email`
      )
        .then((response) => response.json())
        .then((data) => {
          const emailExists = data.length > 0;
          return { username: userExists, email: emailExists };
        });
    });
}

function registerUser(username, email, password) {
  fetch("https://shark-cms.gloor.dev/wp-json/wp/v2/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email,
      password,
      confirm_password: password,
    }), // confirm_password same as password
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw new Error(data.errors.join(", "));
        });
      }
      return response.json();
    })
    .then((data) => {
      if (data.message) {
        console.log("Registration successful", data);
        loginUser(username, password);
      } else {
        console.error("Registration failed:", data.error);
        displayError("Registration failed: " + data.error);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      displayError("Registration error: " + error.message);
    });
}

function loginUser(username, password) {
  fetch("https://shark-cms.gloor.dev/wp-json/jwt-auth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.token) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("email", data.user_email);
        localStorage.setItem("username", username);
        window.location.href = "game.html";
      } else {
        console.error("Login failed:", data.message);
        displayError("Login failed: " + data.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      displayError("Login error: " + error.message);
    });
}
