# RadioDeck 網頁版 (PWA)

純靜態網站（HTML / CSS / JS），不需要後端、不需要建置步驟。

## 佈署到 GitHub Pages
1. GitHub 新增 repository（例如 `radiodeck`），Public。
2. 把本資料夾「裡面的所有檔案」放到 repo 根目錄（`index.html` 要在最外層，`.nojekyll` 也要一起上傳）。
3. Repo → Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main`、資料夾 `/ (root)`，Save。
4. 約 1 分鐘後網址是 `https://<你的帳號>.github.io/radiodeck/`（必須是 https，PWA 與電台播放才會正常）。

指令版：
```
cd radiodeck-web
git init -b main
git add -A
git commit -m "RadioDeck PWA"
git remote add origin https://github.com/<帳號>/radiodeck.git
git push -u origin main
```

## 放進現有的 GitHub Pages 專案
把本資料夾放成子資料夾（例如 `radio/`）即可，網址為 `https://<帳號>.github.io/<repo>/radio/`。
所有路徑都是相對路徑，放在子資料夾也能運作。

## 更新後手機沒變
service worker 會快取。改版時把 `sw.js` 第一行的 `radiodeck-v1` 改成 `radiodeck-v2`，重新 push。

## 手機安裝
- Android Chrome：右上角「📲 安裝」或瀏覽器選單 → 安裝應用程式
- iPhone：用 Safari 開啟 → 分享 → 加入主畫面
