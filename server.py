import json
import subprocess
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder=".")

ROOT = Path(__file__).resolve().parent
WATCHLIST_PATH = ROOT / "data" / "watchlist.json"
UPDATE_SCRIPT = ROOT / "scripts" / "update_market_data.py"

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)

@app.route("/api/add-stock", methods=["POST"])
def add_stock():
    try:
        data = request.json
        group_name = data.get("group")
        code = data.get("code")
        name = data.get("name")

        if not all([group_name, code, name]):
            return jsonify({"error": "所有欄位皆為必填！"}), 400

        if WATCHLIST_PATH.exists():
            with open(WATCHLIST_PATH, "r", encoding="utf-8") as f:
                watchlist = json.load(f)
        else:
            watchlist = {"groups": [], "benchmarks": []}

        # 檢查是否已存在
        for g in watchlist.get("groups", []):
            for s in g.get("stocks", []):
                if s.get("code") == code:
                    return jsonify({"error": f"股票代碼 {code} 已經在觀察清單中！"}), 400

        # 加入板塊
        group_found = False
        for g in watchlist.get("groups", []):
            if g.get("name") == group_name:
                g["stocks"].append({"code": code, "name": name})
                group_found = True
                break

        if not group_found:
            watchlist["groups"].append({
                "name": group_name,
                "stocks": [{"code": code, "name": name}]
            })

        WATCHLIST_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(WATCHLIST_PATH, "w", encoding="utf-8") as f:
            json.dump(watchlist, f, ensure_ascii=False, indent=2)

        # 呼叫爬蟲
        result = subprocess.run(
            ["python3", str(UPDATE_SCRIPT)],
            capture_output=True,
            text=True,
            check=True
        )

        return jsonify({"message": "新增並更新成功！", "log": result.stdout})

    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"已寫入名單，但爬取TWSE失敗：{e.stderr}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
