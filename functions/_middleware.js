export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // ーーー【重要】ここで大学の審査官用の共通パスワードを決めます ーーー
  const CORRECT_PASSWORD = "shidai_megei_2026"; 

  // クッキーをチェック
  const cookie = request.headers.get("Cookie") || "";
  const isAuthed = cookie.includes(`auth_token=${CORRECT_PASSWORD}`);

  // すでにログイン済み、または画像・3Dモデル・音声ファイルへのアクセスなどの場合
  //（拡張子がついているURLや、すでにパスワードを通過している場合はそのままファイルを配信）
  if (isAuthed || url.pathname.includes(".") || url.pathname.startsWith("/media") || url.pathname.startsWith("/models") || url.pathname.startsWith("/sounds")) {
    
    // もしトップページ（/）へのアクセスで、ログイン済みなら portfolio.html を返す
    if (url.pathname === "/") {
      return env.ASSETS.fetch(new Request(new URL("/portfolio.html", request.url)));
    }
    return context.next();
  }

  // パスワード入力フォームから送信（POST）されてきた場合の処理
  if (request.method === "POST") {
    const formData = await request.formData();
    const password = formData.get("password");

    if (password === CORRECT_PASSWORD) {
      // パスワードが一致したらクッキーを付与して、トップページ（portfolio.htmlの中身）へリダイレクト
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `auth_token=${CORRECT_PASSWORD}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
        }
      });
    } else {
      // 間違っていたらエラーメッセージ付きで専用ログイン画面を再表示
      return new Response(getLoginHTML("パスワードが違います。もう一度入力してください。"), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }
  }

  // まだパスワードを入力していない未ログイン状態なら、HTML本体（portfolio.html）は一切読まず、
  // 以下のログイン画面「だけ」をブラウザに送る（これでYouTubeの暴走を100%防ぎます）
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
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #111; color: #fff; margin: 0; }
      .box { background: #222; padding: 40px 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; width: 90%; max-width: 380px; border: 1px solid #333; }
      h1 { font-size: 1.5rem; margin-bottom: 10px; font-weight: 600; letter-spacing: 0.05em; }
      p { font-size: 0.85rem; color: #aaa; margin-bottom: 30px; line-height: 1.6; }
      input[type="password"] { width: 100%; padding: 14px; margin-bottom: 20px; background: #333; border: 1px solid #444; border-radius: 8px; box-sizing: border-box; font-size: 1rem; color: #fff; text-align: center; outline: none; transition: border 0.2s; }
      input[type="password"]:focus { border-color: #0070f3; background: #3a3a3a; }
      button { width: 100%; padding: 14px; background: #0070f3; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: bold; transition: background 0.2s; }
      button:hover { background: #0051cb; }
      .error { color: #ff453a; font-size: 0.85rem; margin-top: 15px; font-weight: 500; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Online Portfolio</h1>
      <p>受験個人情報保護のため制限を設けています。<br>出願書類に記載のパスワードを入力してください。</p>
      <form method="POST">
        <input type="password" name="password" placeholder="パスワードを入力" required autofocus>
        <button type="submit">閲覧を開始する</button>
      </form>
      \${error ? `<div class="error">\${error}</div>` : ""}
    </div>
  </body>
  </html>
  `;
}
