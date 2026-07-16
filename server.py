# server.py (新增此檔作為網頁及API伺服器)
import json
import subprocess
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder=".")

# 指向你的數據路徑
ROOT = Path(__file__).resolve().parent
WATCHLIST_PATH = ROOT / "data" / "watchlist.json"
UPDATE_SCRIPT = ROOT / "scripts" / "update_market_data.py"

# 提供首頁與靜態檔案
@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)

# 處理新增股票的 API
@app.route("/api/add-stock", methods=["POST"])
def add_stock():
    try:
        data = request.json
        group_name = data.get("group")
        code = data.get("code")
        name = data.get("name")

        if not all([group_name, code, name]):
            return jsonify({"error": "所有欄位皆為必填！"}), 400

        # 1. 讀取現有的 watchlist.json
        if WATCHLIST_PATH.exists():
            with open(WATCHLIST_PATH, "r", encoding="utf-8") as f:
                watchlist = json.load(f)
        else:
            watchlist = {"groups": [], "benchmarks": []}

        # 檢查是否已存在該股票
        stock_exists = False
        for g in watchlist["groups"]:
            for s in g["stocks"]:
                if s["code"] == code:
                    stock_exists = True
                    break

        if stock_exists:
            return jsonify({"error": f"股票 {code} 已經在觀察清單中！"}), 400

        # 2. 將新股票加入對應板塊
        group_found = False
        for g in watchlist["groups"]:
            if g["name"] == group_name:
                g["stocks"].append({"code": code, "name": name})
                group_found = True
                break

        if not group_found:
            watchlist["groups"].append({
                "name": group_name,
                "stocks": [{"code": code, "name": name}]
            })

        # 3. 寫回 watchlist.json
        WATCHLIST_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(WATCHLIST_PATH, "w", encoding="utf-8") as f:
            json.dump(watchlist, f, ensure_ascii=False, indent=2)

        # 4. 觸發 Python 爬蟲更新數據
        result = subprocess.run(
            ["python3", str(UPDATE_SCRIPT)],
            capture_output=True,
            text=True,
            check=True
        )

        return jsonify({"message": "Successfully added and updated!", "log": result.stdout})

    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"股票已加入名單，但爬取 TWSE 失敗：{e.stderr}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # 啟動在 8000 埠
    app.run(port=8000, debug=True)
