export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // ーーー【重要】ここで大学の審査官用のパスワードを決めます ーーー
  const CORRECT_PASSWORD = "shidai_megei_2026"; 

  // クッキーをチェック（すでに一度ログインしている場合はそのままスルーしてサイトを表示）
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes(`auth_token=${CORRECT_PASSWORD}`)) {
    return context.next();
  }

  // パスワード入力フォームから送信（POST）されてきた場合の処理
  if (request.method === "POST") {
    const formData = await request.formData();
    const password = formData.get("password");

    if (password === CORRECT_PASSWORD) {
      // パスワードが一致したらクッキーを付与してリダイレクト（ページ再読み込み）
      return new Response("", {
        status: 302,
        headers: {
          "Location": url.pathname,
          "Set-Cookie": `auth_token=${CORRECT_PASSWORD}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
        }
      });
    } else {
      // 間違っていたらエラーメッセージ付きで再表示
      return new Response(getLoginHTML("パスワードが違います。もう一度入力してください。"), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }
  }

  // サイトに初めてアクセスしたときはログイン画面を表示
  return new Response(getLoginHTML(), {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}

// 共通ログイン画面のデザイン（HTML / CSS）
function getLoginHTML(error = "") {
  return `
  <!DOCTYPE html>
  <html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>オンラインポートフォリオ閲覧認証</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8f9fa; margin: 0; }
      .box { background: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; width: 90%; max-width: 380px; }
      h1 { font-size: 1.4rem; margin-bottom: 10px; color: #222; font-weight: 600; }
      p { font-size: 0.9rem; color: #666; margin-bottom: 25px; line-height: 1.5; }
      input[type="password"] { width: 100%; padding: 14px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 1rem; outline: none; transition: border 0.2s; }
      input[type="password"]:focus { border-color: #0070f3; }
      button { width: 100%; padding: 14px; background: #0070f3; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; font-weight: bold; transition: background 0.2s; }
      button:hover { background: #0051cb; }
      .error { color: #ff0000; font-size: 0.85rem; margin-top: 15px; font-weight: 500; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Online Portfolio</h1>
      <p>個人情報保護のためロックをかけています。<br>出願書類に記載のパスワードを入力してください。</p>
      <form method="POST">
        <input type="password" name="password" placeholder="パスワードを入力" required autofocus>
        <button type="submit">閲覧を開始する</button>
      </form>
      ${error ? `<div class="error">${error}</div>` : ""}
    </div>
  </body>
  </html>
  `;
}