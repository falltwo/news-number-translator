# 新聞數字翻譯機

把新聞裡的大數字翻譯成「你的月薪」「滷肉飯」「你那時幾歲」。純靜態網頁,部署在 GitHub Pages。

完整規劃:[docs/規劃書.md](docs/規劃書.md)

## 專案結構

```
index.html          頁面入口
assets/css/style.css
assets/js/app.js    換算公式與渲染
data/news.json      新聞資料(每筆要有來源與核對日)
tests/test.html     換算公式測試(console.assert)
docs/規劃書.md      規劃書
.nojekyll           讓 GitHub Pages 直接提供原始檔
```

## 本機執行

`fetch` 不能用 `file://` 讀 JSON,要開本機伺服器:

```bash
python -m http.server 8000
```

然後打開 http://localhost:8000 ,測試頁在 http://localhost:8000/tests/test.html 。

## 部署

推到 `main` 分支後 GitHub Pages 會自動更新(來源:`main` / root)。

## 分工

- 架構、規劃書、部署設定:已完成
- 程式碼(`app.js`、`style.css`、`index.html` 內容、測試):組員
- 新聞資料核對(`news.json`):待分配

## 資料規則

- 每筆新聞必須填 `source`(原始報導或官方公告)和 `checkedAt`
- 尚未三讀的法案 `status` 一律填「草案」
- 不放新聞內文,只放標題與數字
