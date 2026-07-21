"""Render a short, silent 16:9 Sterling installation demo.

Usage:
  python scripts/render-demo.py --ffmpeg C:\\path\\to\\ffmpeg.exe
"""
from __future__ import annotations

import argparse
import math
import random
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "demo" / "sterling-install-demo.mp4"
FRAUNCES = ROOT / "assets" / "fonts" / "Fraunces-SemiBold.ttf"
MONO = ROOT / "assets" / "fonts" / "JetBrainsMono-Regular.ttf"

W, H, FPS, DURATION = 1280, 720, 24, 15
BG = "#120D1F"
PAPER = "#F6F3FB"
TEXT = "#EDE9F5"
MUTED = "#A99FC4"
EDGE = "#3A2B55"
VIOLET = "#B69AF2"
TEAL = "#5EC9AE"
SWATCHES = ["#B69AF2", "#5EC9AE", "#E88BDD", "#F2C46D", "#86A8E8", "#F29A88", "#B7C974", "#B7C8D1"]

random.seed("sterling-install-demo")
NODES = [(random.uniform(0.04, 0.96), random.uniform(0.06, 0.95), random.uniform(0.8, 2.2)) for _ in range(34)]
EDGES = [(i, (i * 7 + 5) % len(NODES)) for i in range(22)]


def font(size: int, display: bool = False):
    return ImageFont.truetype(FRAUNCES if display else MONO, size=size)


def ease(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def phase_alpha(t: float, start: float, end: float, fade: float = 0.45) -> float:
    return ease((t - start) / fade) * (1 - ease((t - (end - fade)) / fade))


def rgba(hex_value: str, alpha: float):
    hex_value = hex_value.lstrip("#")
    return tuple(int(hex_value[i:i + 2], 16) for i in (0, 2, 4)) + (round(255 * max(0, min(1, alpha))),)


def text(draw: ImageDraw.ImageDraw, xy, value, fill, size, display=False, opacity=1, anchor="la"):
    draw.text(xy, value, font=font(size, display), fill=rgba(fill, opacity), anchor=anchor)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius, fill=fill, outline=outline, width=width)


def constellation(layer: Image.Image, alpha: float = 1):
    draw = ImageDraw.Draw(layer)
    for i, j in EDGES:
        x1, y1, _ = NODES[i]
        x2, y2, _ = NODES[j]
        colour = VIOLET if (i + j) % 2 == 0 else TEAL
        draw.line((x1 * W, y1 * H, x2 * W, y2 * H), fill=rgba(colour, 0.42 * alpha), width=1)
    for x, y, radius in NODES:
        draw.ellipse((x * W - radius, y * H - radius, x * W + radius, y * H + radius), fill=rgba(TEXT, 0.62 * alpha))


def swatches(draw, x, y, width, height, opacity=1):
    block = width / len(SWATCHES)
    mask = Image.new("L", (W, H), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle((x, y, x + width, y + height), radius=4, fill=round(255 * opacity))
    row = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    row_draw = ImageDraw.Draw(row)
    for index, colour in enumerate(SWATCHES):
        row_draw.rectangle((x + index * block, y, x + (index + 1) * block, y + height), fill=rgba(colour, opacity))
    row.putalpha(mask)
    return row


def card(draw, box, opacity=1):
    rounded(draw, box, 6, rgba(BG, 0.98 * opacity), rgba(EDGE, opacity), 1)


def terminal(draw, x, y, width, height, command, typed, opacity=1):
    rounded(draw, (x, y, x + width, y + height), 8, rgba("#1D1530", 0.97 * opacity), rgba(EDGE, opacity), 1)
    for i, colour in enumerate([VIOLET, TEAL, "#E88BDD"]):
        draw.ellipse((x + 21 + i * 16, y + 17, x + 29 + i * 16, y + 25), fill=rgba(colour, opacity))
    draw.line((x, y + 42, x + width, y + 42), fill=rgba(EDGE, opacity), width=1)
    text(draw, (x + 28, y + 81), "$", VIOLET, 22, opacity=opacity)
    text(draw, (x + 51, y + 81), command[:typed], TEXT, 22, opacity=opacity)
    if typed < len(command):
        cursor_x = x + 51 + draw.textlength(command[:typed], font=font(22))
        draw.line((cursor_x + 3, y + 65, cursor_x + 3, y + 88), fill=rgba(TEAL, opacity), width=2)


def code_window(draw, x, y, width, height, reveal, opacity=1):
    rounded(draw, (x, y, x + width, y + height), 8, rgba("#1D1530", 0.98 * opacity), rgba(EDGE, opacity), 1)
    text(draw, (x + 26, y + 28), "TreatmentMeans.tsx", MUTED, 13, opacity=opacity)
    text(draw, (x + width - 28, y + 28), "TSX", VIOLET, 11, opacity=opacity, anchor="ra")
    draw.line((x, y + 52, x + width, y + 52), fill=rgba(EDGE, opacity), width=1)
    lines = [
        ('import "@lamatemaga/sterling/styles.css";', TEAL),
        ('import "@lamatemaga/sterling/editorial.css";', TEAL),
        ("", MUTED),
        ('import { SterlingFigure, SterlingBarChart }', TEXT),
        ('  from "@lamatemaga/sterling";', VIOLET),
        ("", MUTED),
        ("<SterlingFigure", TEXT),
        ('  title="Treatment means"', TEXT),
        ('  source="Your published source">', TEXT),
        ("  <SterlingBarChart data={rows} />", TEAL),
        ("</SterlingFigure>", TEXT),
    ]
    shown = min(len(lines), int(reveal * len(lines)))
    for index, (line, colour) in enumerate(lines[:shown]):
        text(draw, (x + 31, y + 80 + index * 28), line, colour, 15, opacity=opacity)


def figure_preview(draw, x, y, width, height, opacity=1):
    rounded(draw, (x, y, x + width, y + height), 7, rgba(PAPER, opacity), rgba("#CFC5DE", opacity), 1)
    text(draw, (x + 27, y + 29), "BARS   /   CATEGORICAL", "#7C5CE0", 10, opacity=opacity)
    text(draw, (x + 27, y + 71), "Treatment means at a glance", "#241A3D", 26, True, opacity)
    text(draw, (x + 27, y + 108), "A complete, exportable table behind the chart.", "#5C5178", 12, opacity=opacity)
    draw.line((x, y + 132, x + width, y + 132), fill=rgba("#CFC5DE", opacity), width=1)

    plot_x, plot_y, plot_w, plot_h = x + 74, y + 168, width - 122, height - 235
    for grid in range(5):
        gy = plot_y + grid * plot_h / 4
        draw.line((plot_x, gy, plot_x + plot_w, gy), fill=rgba("#D9D1E6", opacity), width=1)
    values = [0.78, 0.91, 0.38, 0.61, 0.54, 0.97]
    for index, value in enumerate(values):
        bar_w = 40
        gap = (plot_w - bar_w * len(values)) / (len(values) - 1)
        bx = plot_x + index * (bar_w + gap)
        by = plot_y + plot_h * (1 - value)
        draw.rounded_rectangle((bx, by, bx + bar_w, plot_y + plot_h), radius=4, fill=rgba(SWATCHES[index], opacity))
        text(draw, (bx + bar_w / 2, plot_y + plot_h + 19), chr(65 + index), "#5C5178", 11, opacity=opacity, anchor="ma")
    draw.line((x, y + height - 40, x + width, y + height - 40), fill=rgba("#CFC5DE", opacity), width=1)
    text(draw, (x + 27, y + height - 19), "Source: processed data", "#5C5178", 10, opacity=opacity)
    text(draw, (x + width - 27, y + height - 19), "Made with Sterling ✦", "#5C5178", 10, opacity=opacity, anchor="ra")


def frame_at(t: float) -> Image.Image:
    image = Image.new("RGBA", (W, H), BG)
    stars = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    constellation(stars, 0.75)
    image.alpha_composite(stars)
    draw = ImageDraw.Draw(image)

    # Signature navigation-scale wordmark, intentionally small.
    text(draw, (58, 47), "La Matemaga", TEXT, 18, True)
    text(draw, (192, 47), ".", VIOLET, 18, True)
    text(draw, (W - 58, 47), "STERLING", VIOLET, 12, opacity=0.9, anchor="ra")

    if t < 3.1:
        a = phase_alpha(t, 0, 3.1)
        text(draw, (80, 184), "Data with a voice", TEXT, 54, True, a)
        text(draw, (80, 246), "of its own", TEXT, 54, True, a)
        text(draw, (421, 246), ".", VIOLET, 54, True, a)
        text(draw, (82, 317), "A palette and reusable components for editorial data stories.", MUTED, 17, opacity=a)
        image.alpha_composite(swatches(draw, 82, 373, 564, 58, a))
        text(draw, (82, 483), "Install once. Keep every figure coherent.", TEAL, 14, opacity=a)
        return image

    if t < 6.2:
        a = phase_alpha(t, 3.0, 6.2)
        text(draw, (80, 142), "1. Install Sterling", TEXT, 42, True, a)
        text(draw, (82, 202), "One package. Your existing React publication.", MUTED, 16, opacity=a)
        terminal(draw, 80, 276, 730, 160, "npm install @lamatemaga/sterling", int(ease((t - 3.25) / 1.5) * 34), a)
        text(draw, (80, 491), "React 18.2+ / React 19 / MDX optional", VIOLET, 13, opacity=a)
        image.alpha_composite(swatches(draw, 856, 293, 320, 44, a))
        text(draw, (856, 372), "Sterling.", TEXT, 33, True, a)
        text(draw, (856, 416), "The palette arrives", MUTED, 16, opacity=a)
        text(draw, (856, 440), "with its editorial shell.", MUTED, 16, opacity=a)
        return image

    if t < 10.1:
        a = phase_alpha(t, 6.0, 10.1)
        text(draw, (80, 113), "2. Import the system", TEXT, 42, True, a)
        text(draw, (82, 170), "Styles, typography, and a figure primitive.", MUTED, 16, opacity=a)
        code_window(draw, 80, 220, 790, 352, ease((t - 6.35) / 1.85), a)
        text(draw, (918, 264), "Optional", VIOLET, 12, opacity=a)
        text(draw, (918, 310), "editorial.css", TEXT, 27, True, a)
        text(draw, (918, 350), "loads Fraunces", MUTED, 15, opacity=a)
        text(draw, (918, 374), "and JetBrains Mono.", MUTED, 15, opacity=a)
        image.alpha_composite(swatches(draw, 918, 432, 270, 38, a))
        return image

    if t < 13.6:
        a = phase_alpha(t, 9.9, 13.6)
        text(draw, (80, 97), "3. Publish the figure", TEXT, 40, True, a)
        text(draw, (82, 149), "Evidence, source, export, and attribution stay together.", MUTED, 15, opacity=a)
        figure_preview(draw, 80, 205, 810, 410, a)
        text(draw, (944, 255), "Made for Markdown", VIOLET, 12, opacity=a)
        text(draw, (944, 303), "One figure", TEXT, 30, True, a)
        text(draw, (944, 342), "can travel across", TEXT, 30, True, a)
        text(draw, (944, 381), "your whole blog.", TEXT, 30, True, a)
        text(draw, (944, 455), "Copy image", TEAL, 14, opacity=a)
        text(draw, (944, 484), "Download CSV", TEAL, 14, opacity=a)
        text(draw, (944, 513), "Share on mobile", TEAL, 14, opacity=a)
        return image

    a = phase_alpha(t, 13.3, 15.0)
    text(draw, (W / 2, 244), "Install. Write. Publish", TEXT, 54, True, a, anchor="ma")
    text(draw, (W / 2 + 285, 244), ".", VIOLET, 54, True, a, anchor="ma")
    text(draw, (W / 2, 318), "Sterling keeps data stories visually coherent.", MUTED, 17, opacity=a, anchor="ma")
    image.alpha_composite(swatches(draw, 358, 382, 564, 54, a))
    text(draw, (W / 2, 501), "github.com/LaMatemaga/sterling", TEAL, 14, opacity=a, anchor="ma")
    return image


def render(ffmpeg: str):
    with tempfile.TemporaryDirectory(prefix="sterling-demo-") as frames:
        frames_dir = Path(frames)
        for index in range(FPS * DURATION):
            image = frame_at(index / FPS).convert("RGB")
            image.save(frames_dir / f"frame_{index:04d}.png", quality=95)

        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            ffmpeg, "-y", "-framerate", str(FPS),
            "-i", str(frames_dir / "frame_%04d.png"),
            "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-crf", "18", "-movflags", "+faststart", str(OUTPUT),
        ], check=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg") or "ffmpeg")
    args = parser.parse_args()
    render(args.ffmpeg)
    print(OUTPUT)
