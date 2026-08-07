const PRODUCT_NAME = "大工黑客松组队中心";

type LoginEmailOptions = {
  url: string;
  expires: Date;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

function formatExpiration(expires: Date) {
  return `${new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(expires)}（北京时间）`;
}

export function createLoginEmail({ url, expires }: LoginEmailOptions) {
  const expiration = formatExpiration(expires);
  const safeUrl = escapeHtml(url);
  const safeExpiration = escapeHtml(expiration);
  const subject = `登录${PRODUCT_NAME}`;
  const text = [
    "你好！",
    "",
    `你正在登录${PRODUCT_NAME}。请点击下面的链接完成登录：`,
    url,
    "",
    `此链接仅可使用一次，并将于 ${expiration} 失效。`,
    "如果这不是你的操作，请忽略本邮件，无需进行任何操作。",
    "",
    "大工黑客松 S2 组队中心",
  ].join("\n");

  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f7fb;color:#0b1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">你的专属登录链接已生成，请在有效期内完成登录。</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f3f7fb;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #dbe7f3;border-radius:20px;box-shadow:0 18px 50px rgba(15,47,87,0.12);overflow:hidden;">
            <tr>
              <td style="height:6px;background-color:#168fff;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:36px 40px 32px;background-color:#071a33;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td>
                      <div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:2px;color:#53d8ff;">DUT HACKATHON · S2</div>
                      <h1 style="margin:12px 0 0;font-size:30px;line-height:40px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">登录组队中心</h1>
                      <p style="margin:10px 0 0;font-size:15px;line-height:24px;color:#b9cbe0;">一封邮件，安全开启你的黑客松旅程。</p>
                    </td>
                    <td width="58" valign="top" align="right" style="width:58px;">
                      <div style="width:52px;height:52px;border:1px solid #29517d;border-radius:14px;background-color:#0c2a4f;color:#53d8ff;font-size:17px;font-weight:800;line-height:52px;text-align:center;letter-spacing:1px;">DUT</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 40px 18px;">
                <p style="margin:0;font-size:17px;line-height:28px;font-weight:700;color:#101828;">你好！</p>
                <p style="margin:12px 0 0;font-size:16px;line-height:28px;color:#475467;">我们收到了你的登录请求。点击下方按钮，即可安全登录大工黑客松组队中心。</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:14px 40px 30px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#087cf0" style="border-radius:10px;box-shadow:0 8px 20px rgba(8,124,240,0.24);">
                      <a href="${safeUrl}" style="display:inline-block;padding:14px 36px;border:1px solid #087cf0;border-radius:10px;color:#ffffff;font-size:16px;line-height:22px;font-weight:700;text-decoration:none;">安全登录</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 34px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f0f7ff;border:1px solid #cfe5fb;border-radius:12px;">
                  <tr>
                    <td width="42" valign="top" style="width:42px;padding:16px 0 16px 18px;color:#087cf0;font-size:18px;line-height:24px;">●</td>
                    <td style="padding:16px 18px 16px 4px;font-size:13px;line-height:22px;color:#31506f;">
                      此链接仅可使用一次，并将于<br>
                      <strong style="color:#12395f;">${safeExpiration}</strong> 失效。
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 38px;">
                <div style="height:1px;background-color:#e7edf4;font-size:0;line-height:0;">&nbsp;</div>
                <p style="margin:24px 0 8px;font-size:13px;line-height:22px;color:#667085;">按钮无法点击？请复制下面的链接到浏览器中打开：</p>
                <p style="margin:0;padding:12px 14px;background-color:#f8fafc;border-radius:8px;font-size:12px;line-height:19px;word-break:break-all;color:#0870d8;">${safeUrl}</p>
                <p style="margin:22px 0 0;font-size:13px;line-height:22px;color:#98a2b3;">如果这不是你的操作，请直接忽略本邮件。我们不会要求你回复邮件或提供登录链接。</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e7edf4;">
                <p style="margin:0;font-size:12px;line-height:20px;font-weight:700;color:#344054;">大工黑客松 S2 组队中心</p>
                <p style="margin:4px 0 0;font-size:11px;line-height:18px;letter-spacing:1px;color:#98a2b3;">BUILD · COLLABORATE · CREATE</p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-size:11px;line-height:18px;color:#98a2b3;">这是一封系统自动发送的邮件，请勿直接回复。</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
