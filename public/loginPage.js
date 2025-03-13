console.log("✅ Authentication script loaded and running...");

async function checkAuth() {
  console.log("🔄 Checking authentication...");

  try {
    const response = await fetch("/user/auth/status");
    console.log("✅ Response received:", response);

    const data = await response.json();
    console.log("📄 Parsed JSON:", data);

    if (data.loggedIn) {
      console.log("👤 User is logged in:", data.user.name);
      document.getElementById(
        "status-text"
      ).textContent = `Welcome, ${data.user.name}!`;
      document.getElementById("logout-btn").style.display = "inline-block";
    } else {
      console.log("🚪 User is not logged in.");
      updateLoginButtons();
    }
  } catch (error) {
    console.error("❌ Error checking auth status:", error);
    document.getElementById("status-text").textContent =
      "Error checking authentication!";
  }
}

function updateLoginButtons() {
  const statusText = document.getElementById("status-text");
  const googleLoginBtn = document.getElementById("google-login-btn");
  const facebookLoginBtn = document.getElementById("facebook-login-btn");

  if (googleLoginBtn) googleLoginBtn.style.display = "inline-block";
  if (facebookLoginBtn) facebookLoginBtn.style.display = "inline-block";

  statusText.textContent = "Please log in with Google or Facebook";
}

// ✅ Ensures `checkAuth()` runs when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌐 DOM fully loaded. Running checkAuth()...");
  checkAuth();
});
