console.log("✅ Script is loaded and running...");

async function checkAuth() {
  console.log("🔄 Starting authentication check...");

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
      document.getElementById("status-text").textContent = "Login with Google";
      document.getElementById("login-btn").style.display = "inline-block";
    }
  } catch (error) {
    console.error("❌ Error checking auth status:", error);
    document.getElementById("status-text").textContent =
      "Error checking authentication!";
  }
}

// ✅ Ensures `checkAuth()` runs when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌐 DOM fully loaded. Running checkAuth()...");
  checkAuth();
});
