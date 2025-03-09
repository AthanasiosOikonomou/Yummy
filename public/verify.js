document.addEventListener("DOMContentLoaded", async () => {
  const message = document.getElementById("message");
  const resendBtn = document.getElementById("resend-btn");

  // Extract token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token) {
    message.textContent = "Invalid verification link.";
    resendBtn.classList.remove("hidden");
    return;
  }

  try {
    const response = await fetch(`/user/verify-email?token=${token}`);
    const data = await response.json();

    if (response.ok) {
      message.textContent =
        "✅ Email successfully verified! You can now log in.";
    } else {
      message.textContent = "❌ Verification failed: " + data.message;
      resendBtn.classList.remove("hidden");
    }
  } catch (error) {
    message.textContent = "❌ An error occurred. Please try again.";
    resendBtn.classList.remove("hidden");
  }

  // Resend verification email
  resendBtn.addEventListener("click", async () => {
    const email = urlParams.get("email");
    if (!email) return;

    try {
      const response = await fetch("/user/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      message.textContent = response.ok
        ? "✅ Verification email resent! Check your inbox."
        : "❌ " + data.message;
      resendBtn.classList.add("hidden");
    } catch (error) {
      message.textContent =
        "❌ Could not resend verification email. Try again later.";
    }
  });
});
