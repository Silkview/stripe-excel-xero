#!/usr/bin/env python3
"""Letterbox images to 1366x768 for marketplace / docs screenshots."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "screenshots"
TARGET = (1366, 768)
# Matches addin task pane / landing neutral background
BG = (245, 246, 248)

CONVERSIONS: list[tuple[Path, str]] = []


def letterbox(src: Path, dst: Path) -> None:
    img = Image.open(src).convert("RGBA")
    canvas = Image.new("RGBA", TARGET, BG + (255,))
    img.thumbnail(TARGET, Image.Resampling.LANCZOS)
    x = (TARGET[0] - img.width) // 2
    y = (TARGET[1] - img.height) // 2
    if img.mode == "RGBA":
        canvas.paste(img, (x, y), img)
    else:
        canvas.paste(img, (x, y))
    canvas.convert("RGB").save(dst, "PNG", optimize=True)
    print(f"  {src.name} ({img.width}x{img.height} on canvas) -> {dst.name}")


def main() -> None:
    cursor_images = Path.home() / (
        "Library/Application Support/Cursor/User/workspaceStorage/"
        "001f9d9ef95e736adc88743f1f2609b5/images"
    )
    sources: list[tuple[str, str]] = [
        ("Main Screen-fd672ef3-9809-4434-a30b-8a70f71d0c60.png", "taskpane-pull-1366x768.png"),
        ("Build Screen-2abeb87f-45a6-4be2-8199-4da882c38c4c.png", "taskpane-build-1366x768.png"),
        ("Xero Push Screen-b84d393c-30b5-4d10-aae0-3bf24fa668a5.png", "taskpane-push-1366x768.png"),
        (
            "Account Setup SCreen-e02d65e3-a1c3-4a05-947e-f36f04ce8593.png",
            "account-mappings-1366x768.png",
        ),
        (
            "Stripe Download Screen-2bb8d23a-3fbf-402c-b3a5-577319dfff54.png",
            "stripe-balance-transactions-1366x768.png",
        ),
    ]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src_name, out_name in sources:
        src = cursor_images / src_name
        if not src.exists():
            raise FileNotFoundError(f"Missing source image: {src}")
        letterbox(src, OUT_DIR / out_name)
    print(f"Done. Wrote {len(sources)} files to {OUT_DIR}")


if __name__ == "__main__":
    main()
