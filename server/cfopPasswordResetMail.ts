type PasswordResetMail = { email: string; displayName: string; resetToken: string };

function configuredValue(name: "RESEND_API_KEY" | "RESEND_FROM_EMAIL" | "CFOP_APP_URL") {
  return process.env[name]?.trim() ?? "";
}

export function passwordResetEmailConfigured() {
  return Boolean(configuredValue("RESEND_API_KEY") && configuredValue("RESEND_FROM_EMAIL") && configuredValue("CFOP_APP_URL"));
}

export async function sendCfopPasswordResetEmail({ email, displayName, resetToken }: PasswordResetMail) {
  const apiKey = configuredValue("RESEND_API_KEY");
  const from = configuredValue("RESEND_FROM_EMAIL");
  const appUrl = configuredValue("CFOP_APP_URL").replace(/\/$/, "");
  if (!apiKey || !from || !appUrl) throw new Error("PASSWORD_RESET_EMAIL_NOT_CONFIGURED");
  const resetUrl = `${appUrl}/profile?reset=${encodeURIComponent(resetToken)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Đặt lại mật khẩu CFOP Solver Studio",
      text: `Chào ${displayName},\n\nDùng liên kết dưới đây để đặt lại mật khẩu CFOP Solver Studio. Liên kết hết hạn sau 30 phút:\n${resetUrl}\n\nNếu bạn không yêu cầu thao tác này, hãy bỏ qua email.`,
    }),
  });
  if (!response.ok) throw new Error(`PASSWORD_RESET_EMAIL_FAILED_${response.status}`);
}
