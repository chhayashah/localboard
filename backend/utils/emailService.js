const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Connection test
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email connection failed:", error.message);
  } else {
    console.log("✅ Email server ready");
  }
});

const sendOTPSms = async (phone, otp) => {
  try {
    const response = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: `91${phone}`,
        otp: otp,
      }),
    });

    const data = await response.json();
    console.log("MSG91 response:", data);

    if (data.type === "success") {
      console.log(`✅ OTP SMS sent to ${phone}`);
      return true;
    } else {
      throw new Error(data.message || "SMS failed");
    }
  } catch (e) {
    console.error("❌ SMS OTP failed:", e.message);
    throw e;
  }
};

module.exports = { sendOTPSms };

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"GrowUp 🏙️" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} — Aapka GrowUp OTP`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;
                  background:#09090F;color:#F1F3FF;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#F5A623,#FF6B2B);
                    padding:24px;text-align:center;">
          <h1 style="margin:0;font-size:26px;color:#000;">🏙️ LocalBoard</h1>
          <p style="margin:4px 0 0;color:#000;font-size:12px;">
            Apna Sheher. Apni Awaaz.
          </p>
        </div>
        <div style="padding:32px 28px;">
          <h2 style="color:#F1F3FF;margin:0 0 8px">Login OTP</h2>
          <p style="color:rgba(241,243,255,0.6);margin:0 0 20px">
            Aapka OTP code neeche hai:
          </p>
          <div style="background:#17181F;
                      border:2px solid rgba(245,166,35,0.3);
                      border-radius:12px;padding:20px;text-align:center;">
            <span style="font-size:38px;font-weight:800;
                         letter-spacing:10px;color:#F5A623;">
              ${otp}
            </span>
          </div>
          <p style="color:rgba(241,243,255,0.35);font-size:12px;
                    margin-top:20px;line-height:1.6;">
            ⏱ Yeh OTP <strong>10 minutes</strong> mein expire hoga.<br>
            🔒 Kisi ko share mat karein.
          </p>
        </div>
        <div style="background:#111219;padding:14px;text-align:center;
                    font-size:11px;color:rgba(241,243,255,0.2);">
          LocalBoard — Apne Ward Ki Awaaz
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent:", info.messageId);
  } catch (error) {
    console.error("❌ OTP email failed:", error.message);
    throw new Error("Email send nahi hua: " + error.message);
  }
};

module.exports = { sendOTPEmail };
