# 台股產業趨勢儀表板

這是可自行維護的本機網站。資料更新程式會從臺灣證券交易所（TWSE）下載「股票觀察」名單的收盤價，重新產生 `data/market_data.json`；網站僅讀取這份資料檔，因此不需要 API 金鑰。

## 使用方式

```bash
cd /Users/ww098/Downloads/stock-monitor-dashboard
python3 scripts/update_market_data.py
python3 -m http.server 8000
```

瀏覽器開啟 `http://localhost:8000`。第一次使用與每次自動排程都應執行第一個指令。

## 調整監測股票

編輯 `data/watchlist.json`，在對應板塊的 `stocks` 新增 `{ "code": "股票代號", "name": "名稱" }`；重跑更新程式即可。板塊週報酬採其成分股等權平均。

## 自動更新

已建立的 Codex 每週五排程可改為執行：

```bash
cd /Users/ww098/Downloads/stock-monitor-dashboard && python3 scripts/update_market_data.py
```

若要在 macOS 每個交易日下午 3:30 自動更新，可將同一指令加入 `launchd` 或任何排程工具。資料來源若尚未完成收盤，程式會保留最近可取得的交易日。

本專案僅做市場資料整理，不構成投資建議。
