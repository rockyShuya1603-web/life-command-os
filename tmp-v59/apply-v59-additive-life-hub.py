#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil

root = Path.cwd()
base = Path(__file__).resolve().parent

component = (base / "LifeV59FeatureHub.tsx").read_text(encoding="utf-8")

routes = {
    "life-hub": "life-hub-page.tsx",
    "quick-add": "quick-add-page.tsx",
    "memo-to-todo": "memo-to-todo-page.tsx",
    "routine-templates": "routine-templates-page.tsx",
    "titles": "titles-page.tsx",
    "gacha-collection": "gacha-collection-page.tsx",
    "money-insights": "money-insights-page.tsx",
    "weekly-review": "weekly-review-page.tsx",
}

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        backup = path.with_suffix(path.suffix + f".backup-v59-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        shutil.copyfile(path, backup)
        print("backup", backup)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def install_app(app_dir: Path):
    write_file(app_dir / "components" / "LifeV59FeatureHub.tsx", component)
    for route, filename in routes.items():
        write_file(app_dir / route / "page.tsx", (base / filename).read_text(encoding="utf-8"))

if (root / "app").exists():
    install_app(root / "app")

if (root / "src" / "app").exists():
    install_app(root / "src" / "app")

print("v59 additive Life Hub installed")
