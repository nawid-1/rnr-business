#!/usr/bin/env python3
"""
RNR Business — dokumentaation generaattori.

Skannaa projektin ja päivittää docs/-kansion dynaamiset osat:
- nykyinen päivämäärä
- API-reitit (src/app/api/**/route.ts)
- ympäristömuuttujat (process.env.X koodissa)

Ajetaan automaattisesti git pre-commit hookista. Voi ajaa myös käsin:
    python scripts/generate_docs.py
"""

import re
import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
APP_URL = "https://rnr-business-sgzu.vercel.app"
_d = datetime.date.today()
TODAY = f"{_d.day}.{_d.month}.{_d.year}"


def discover_api_routes():
    """Etsii kaikki API-reitit ja lyhyen kuvauksen kommentista jos löytyy."""
    routes = []
    api_dir = ROOT / "src" / "app" / "api"
    if not api_dir.exists():
        return routes
    for route_file in sorted(api_dir.rglob("route.ts")):
        rel = route_file.relative_to(ROOT / "src" / "app")
        url = "/" + str(rel.parent).replace("\\", "/")
        routes.append(url)
    return routes


def discover_env_vars():
    """Etsii process.env.X viittaukset koodista."""
    env_vars = set()
    src = ROOT / "src"
    pattern = re.compile(r"process\.env\.([A-Z0-9_]+)")
    for f in src.rglob("*.ts"):
        try:
            text = f.read_text(encoding="utf-8")
        except Exception:
            continue
        for m in pattern.findall(text):
            env_vars.add(m)
    # poista placeholderit / sisäiset
    ignore = {"NODE_ENV"}
    return sorted(v for v in env_vars if v not in ignore)


def update_block(content: str, marker: str, new_body: str) -> str:
    """Korvaa <!-- AUTO:marker --> ... <!-- /AUTO:marker --> -lohkon sisällön."""
    start = f"<!-- AUTO:{marker} -->"
    end = f"<!-- /AUTO:{marker} -->"
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    replacement = f"{start}\n{new_body}\n{end}"
    if pattern.search(content):
        return pattern.sub(replacement, content)
    return content


def main():
    if not DOCS.exists():
        print("docs/ ei löydy — ohitetaan.")
        return

    # 1. Päivitä päivämäärä README:ssä ja yleiskatsauksessa
    for name in ["README.md", "01-yleiskatsaus.md"]:
        p = DOCS / name
        if p.exists():
            text = p.read_text(encoding="utf-8")
            text = re.sub(r"(Päivitetty[:\s]*)\d{1,2}\.\d{1,2}\.\d{4}", rf"\g<1>{TODAY}", text)
            p.write_text(text, encoding="utf-8")

    # 2. Päivitä API-reitit teknisessä dokumentissa
    routes = discover_api_routes()
    if routes:
        body = "\n".join(f"- `{r}`" for r in routes)
        tech = DOCS / "02-tekninen-rakenne.md"
        if tech.exists():
            text = tech.read_text(encoding="utf-8")
            text = update_block(text, "api-routes", body)
            tech.write_text(text, encoding="utf-8")

    # 3. Päivitä env-muuttujat setup-muistilistassa
    env_vars = discover_env_vars()
    if env_vars:
        body = "\n".join(f"- `{v}`" for v in env_vars)
        setup = DOCS / "05-setup-muistilista.md"
        if setup.exists():
            text = setup.read_text(encoding="utf-8")
            text = update_block(text, "env-vars", body)
            setup.write_text(text, encoding="utf-8")

    print(f"Dokumentaatio päivitetty ({TODAY}). Reittejä: {len(routes)}, env-muuttujia: {len(env_vars)}.")


if __name__ == "__main__":
    main()
