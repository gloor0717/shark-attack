document.addEventListener("DOMContentLoaded", () => {
  redirectIfLoggedIn();
  updateNavbarBasedOnLogin();
  setupPageSpecificFunctions();
  hideLoginElementsIfLoggedIn();
});

function setupPageSpecificFunctions() {
  // For profile.html
  if (window.location.pathname.endsWith("profile.html")) {
    displayUserProfile();
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
      logoutButton.addEventListener("click", logoutUser);
    }
  }

  // For login.html
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      loginUser(username, password);
    });
  }
}

function loginUser(username, password) {
  const loginButton = document.getElementById("loginButton");
  loginButton.textContent = "Logging in...";
  loginButton.disabled = true;

  clearLoginError();

  fetch("https://shark-cms.gloor.dev/wp-json/jwt-auth/v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401) {
          // Handling incorrect credentials
          throw new Error("Incorrect username or password");
        } else {
          // Handling other types of HTTP errors
          throw new Error("Login failed");
        }
      }
      return response.json();
    })
    .then((data) => {
      if (data.token) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("email", data.user_email); // Store email in localStorage
        localStorage.setItem("username", username);
        updateNavbar(username);
        window.location.href = "game.html";
      } else {
        console.error("Login failed");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      displayLoginError(error.message);
    })
    .finally(() => {
      loginButton.textContent = "Login";
      loginButton.disabled = false;
    });
}

function updateNavbar(username) {
  const loginLink = document.getElementById("loginLink");
  if (loginLink) {
    loginLink.textContent = username;
    loginLink.href = "profile.html";
  }
}

function updateNavbarBasedOnLogin() {
  const loginLink = document.getElementById("loginLink");
  const storedUsername = localStorage.getItem("username");

  if (storedUsername) {
    loginLink.textContent = storedUsername;
    loginLink.href = "profile.html";
  } else {
    loginLink.textContent = "Login";
    loginLink.href = "login.html";
  }
}

function displayUserProfile() {
  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email");

  if (username) {
    document.getElementById("profileUsername").textContent = username;
  } else {
    document.getElementById("profileUsername").textContent = "Not available";
  }

  if (email) {
    document.getElementById("profileEmail").textContent = email;
  } else {
    document.getElementById("profileEmail").textContent = "Not available";
  }
}

function logoutUser() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  window.location.href = "index.html"; // Redirect to home page after logout
}

function hideLoginElementsIfLoggedIn() {
  const storedUsername = localStorage.getItem("username");
  if (storedUsername) {
    hideElementById("mainLoginButton");
    hideElementById("mainNoAccountLink");
  }
}

function hideElementById(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = "none";
  }
}

function redirectIfLoggedIn() {
  const storedUsername = localStorage.getItem("username");
  const isLoginPage = window.location.pathname.endsWith("login.html");
  const isRegisterPage = window.location.pathname.endsWith("register.html");

  if (storedUsername && (isLoginPage || isRegisterPage)) {
    window.location.href = "profile.html";
  }
}

function registerUser(username, email, password, confirmPassword) {
  fetch("https://shark-cms.gloor.dev/wp-json/wp/v2/register/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      password,
      confirm_password: confirmPassword,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw new Error(data.errors.join(", ")); // Join multiple error messages
        });
      }
      return response.json();
    })
    .then((data) => {
      if (data.message) {
        loginUser(username, password); // Automatically log in the user after registration
      } else {
        console.error("Registration failed:", data.error);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function displayLoginError(message) {
  const errorContainer = document.getElementById("loginError");
  errorContainer.textContent = message;
  errorContainer.style.display = "block";
}

function clearLoginError() {
  const errorContainer = document.getElementById("loginError");
  errorContainer.textContent = "";
  errorContainer.style.display = "none";
}
