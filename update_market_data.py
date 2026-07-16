#!/usr/bin/env python3
"""Download TWSE daily closing data and generate the dashboard data file."""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from statistics import mean
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
WATCHLIST = ROOT / "data" / "watchlist.json"
OUTPUT = ROOT / "data" / "market_data.json"
API = "https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date={date}&stockNo={code}"


def fetch_history(code: str) -> list[dict]:
    date = datetime.now().strftime("%Y%m01")
    request = Request(API.format(date=date, code=code), headers={"User-Agent": "stock-monitor-dashboard/1.0"})
    with urlopen(request, timeout=20) as response:
        payload = json.load(response)
    if payload.get("stat") != "OK":
        raise RuntimeError(f"{code}: {payload.get('stat', 'unknown TWSE error')}")
    rows = []
    for row in payload.get("data", []):
        try:
            rows.append({"date": row[0], "close": float(row[6].replace(",", ""))})
        except (IndexError, ValueError):
            continue
    if len(rows) < 2:
        raise RuntimeError(f"{code}: not enough trading days")
    return rows


def pct(start: float, end: float) -> float:
    return round((end / start - 1) * 100, 2)


def summarize(stock: dict) -> dict:
    rows = fetch_history(stock["code"])
    baseline = rows[max(0, len(rows) - 5)]
    latest = rows[-1]
    previous = rows[-2]
    trend = [{"date": row["date"], "return": pct(baseline["close"], row["close"])} for row in rows[-5:]]
    return {**stock, "close": latest["close"], "as_of": latest["date"], "week_return": pct(baseline["close"], latest["close"]), "day_return": pct(previous["close"], latest["close"]), "trend": trend}


def main() -> int:
    watchlist = json.loads(WATCHLIST.read_text(encoding="utf-8"))
    failures, groups = [], []
    for group in watchlist["groups"]:
        stocks = []
        for stock in group["stocks"]:
            try:
                stocks.append(summarize(stock))
            except Exception as error:
                failures.append(str(error))
        if stocks:
            groups.append({"name": group["name"], "stocks": stocks, "week_return": round(mean(item["week_return"] for item in stocks), 2), "day_return": round(mean(item["day_return"] for item in stocks), 2)})
    benchmarks = []
    for stock in watchlist.get("benchmarks", []):
        try:
            benchmarks.append(summarize(stock))
        except Exception as error:
            failures.append(str(error))
    if not groups:
        raise RuntimeError("No market data could be retrieved. " + "; ".join(failures))
    as_of = max(stock["as_of"] for group in groups for stock in group["stocks"])
    output = {"generated_at": datetime.now().astimezone().isoformat(timespec="seconds"), "as_of": as_of, "groups": groups, "benchmarks": benchmarks, "failures": failures, "source": "TWSE STOCK_DAY monthly daily trading information"}
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {OUTPUT} for {as_of}; {len(failures)} symbols unavailable.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Update failed: {error}", file=sys.stderr)
        raise SystemExit(1)
