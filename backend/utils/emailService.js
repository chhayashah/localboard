const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"LocalBoard 🏙️" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} — Aapka LocalBoard OTP`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#09090F;color:#F1F3FF;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#F5A623,#FF6B2B);padding:24px;text-align:center;">
          <h1 style="margin:0;font-size:26px;color:#000;">🏙️ LocalBoard</h1>
          <p style="margin:4px 0 0;color:#000;font-size:12px;">Apna Sheher. Apni Awaaz.</p>
        </div>
        <div style="padding:32px 28px;">
          <h2 style="color:#F1F3FF;margin:0 0 8px">Login OTP</h2>
          <p style="color:rgba(241,243,255,0.6);margin:0 0 20px">Aapka OTP code:</p>
          <div style="background:#17181F;border:2px solid rgba(245,166,35,0.3);border-radius:12px;padding:20px;text-align:center;">
            <span style="font-size:38px;font-weight:800;letter-spacing:10px;color:#F5A623;">${otp}</span>
          </div>
          <p style="color:rgba(241,243,255,0.35);font-size:12px;margin-top:20px;line-height:1.6;">
            ⏱ 10 minutes mein expire hoga.<br>🔒 Kisi ko share mat karein.
          </p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail };
