#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import json
import shutil

root = Path.cwd()
vercel_path = root / "vercel.json"

# Vercel Hobby は daily cron までなので、1日1回に変更する
DAILY_CRON = {
    "path": "/api/mail/gmail/auto-sync",
    "schedule": "0 3 * * *"
}

data = {}
if vercel_path.exists():
    backup = vercel_path.with_suffix(vercel_path.suffix + f".backup-v50-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(vercel_path, backup)
    print(f"backup: {backup}")

    try:
        data = json.loads(vercel_path.read_text(encoding="utf-8"))
    except Exception:
        data = {}
else:
    print("vercel.json was not found. creating new one.")

crons = data.get("crons")
if not isinstance(crons, list):
    crons = []

# 既存の Gmail auto-sync cron は削除して、Hobby対応の daily だけにする
crons = [
    cron for cron in crons
    if not (
        isinstance(cron, dict)
        and cron.get("path") == "/api/mail/gmail/auto-sync"
    )
]
crons.append(DAILY_CRON)
data["crons"] = crons

vercel_path.write_text(
    json.dumps(data, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8"
)

print("patched: vercel.json")
print("cron schedule: 0 3 * * *  # once per day / Vercel Hobby compatible")
