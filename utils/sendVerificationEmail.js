const nodemailer = require("nodemailer");
const { contentSecurityPolicy } = require("helmet");
const jwt = require("jsonwebtoken");

const { FRONT_END_URL, envPORT, EMAIL_USER, EMAIL_PASS, JWT_SECRET } =
  process.env;

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Send verification email function
const sendVerificationEmail = async (user) => {
  const token = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: "1d",
  });

  const verificationUrl = `${FRONT_END_URL}:${envPORT}/verify.html?token=${token}&email=${encodeURIComponent(
    user.email
  )}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Verify Your Email",
    html: `
<div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f2f4f8; padding: 40px;">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">

  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">

    <!-- Logo Section -->
    <div style="background: linear-gradient(90deg, #white, #white); padding: 30px; text-align: center;">
      <img src="cid:yummylogo" alt="Yummy Logo" style="width: 120px; margin-bottom: 10px;" />
      <h2 style="color: black; margin: 0; font-weight: 600;">Καλωσόρισες στο Yummy!</h2>
    </div>

    <div style="padding: 30px; color: #333;">
      <p style="font-size: 16px; line-height: 1.6;">
        Γεια σου <strong>${user.name || "φίλε/φίλη"}</strong>,<br><br>
        Σε ευχαριστούμε για την εγγραφή σου. Παρακαλούμε επιβεβαίωσε τη διεύθυνση email σου πατώντας το παρακάτω κουμπί:
      </p>

      <!-- Call to Action Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${verificationUrl}" 
           style="display: inline-block; background-color: #b91c1c; color: white; padding: 14px 30px; text-decoration: none; font-size: 16px; border-radius: 50px; font-weight: 400; transition: background 0.3s ease;">
          Επιβεβαίωση Email
        </a>
      </div>

      <p style="font-size: 14px; color: #777;">
        Αν δεν έκανες εσύ την εγγραφή, μπορείς απλώς να αγνοήσεις αυτό το μήνυμα.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9f9f9; padding: 20px; text-align: center;">
      <p style="font-size: 12px; color: #999;">
        &copy; ${new Date().getFullYear()} Yummy. Όλα τα δικαιώματα διατηρούνται.
      </p>
    </div>
  </div>
</div>
    `,
    attachments: [
      {
        filename: "logo.png",
        path: "public/Images/Yummy_Logo.png",
        cid: "yummylogo", // Same as src in <img>
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

// Send reset password email function
const sendResetPasswordEmail = async (user, resetUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Yummy - Reset Password",
    html: resetUrl,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
