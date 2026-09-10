import os
from PIL import Image, ImageDraw, ImageFont

tech_dir = os.path.abspath(os.path.join("screenshots", "tech_stack"))
os.makedirs(tech_dir, exist_ok=True)

# Define tech stack items with brand colors and icons
tech_items = [
    {"name": "react", "title": "React.js 18", "sub": "Frontend SPA & UI", "bg": "#0B192C", "fg": "#00D8FF", "symbol": "⚛"},
    {"name": "python", "title": "Python 3.12", "sub": "Core Language", "bg": "#1E2A38", "fg": "#FFD438", "symbol": "🐍"},
    {"name": "django", "title": "Django & DRF", "sub": "Backend REST API", "bg": "#092E20", "fg": "#44B78B", "symbol": "⚡"},
    {"name": "postgresql", "title": "PostgreSQL 16", "sub": "Relational DB (RLS)", "bg": "#1A2E40", "fg": "#418CC4", "symbol": "🐘"},
    {"name": "redis", "title": "Redis & Celery", "sub": "Async Worker & Broker", "bg": "#3A1110", "fg": "#FF4438", "symbol": "⚡"},
    {"name": "tailwind", "title": "Tailwind CSS", "sub": "Responsive Design", "bg": "#0C2333", "fg": "#38BDF8", "symbol": "🎨"}
]

for item in tech_items:
    w, h = 380, 110
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded background card
    card_bg = item["bg"]
    border_color = item["fg"]
    draw.rounded_rectangle([2, 2, w - 2, h - 2], radius=14, fill=card_bg, outline=border_color, width=2)

    # Load font or default
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 26)
        font_small = ImageFont.truetype("arial.ttf", 16)
        font_symbol = ImageFont.truetype("seguiemj.ttf", 36)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_symbol = ImageFont.load_default()

    # Draw symbol
    draw.text((25, 30), item["symbol"], fill=item["fg"], font=font_symbol)

    # Draw Title and Subtitle
    draw.text((85, 24), item["title"], fill="#FFFFFF", font=font_large)
    draw.text((85, 62), item["sub"], fill=item["fg"], font=font_small)

    out_path = os.path.join(tech_dir, f"{item['name']}.png")
    img.save(out_path, "PNG")
    print(f"Generated badge: {out_path}")

# Also create a composite tech stack grid image
grid_w = 780
grid_h = 240
grid_img = Image.new("RGBA", (grid_w, grid_h), (248, 250, 252, 255))
grid_draw = ImageDraw.Draw(grid_img)
grid_draw.rounded_rectangle([2, 2, grid_w - 2, grid_h - 2], radius=16, fill="#F1F5F9", outline="#CBD5E1", width=1)

# Paste badges into grid (2 rows x 3 cols)
cols = 3
for i, item in enumerate(tech_items):
    badge_path = os.path.join(tech_dir, f"{item['name']}.png")
    badge = Image.open(badge_path).resize((240, 70), Image.Resampling.LANCZOS)
    col = i % cols
    row = i // cols
    x = 20 + col * 250
    y = 20 + row * 85
    grid_img.paste(badge, (x, y), badge)

grid_out = os.path.join(tech_dir, "tech_stack_grid.png")
grid_img.save(grid_out, "PNG")
print(f"Generated combined grid image: {grid_out}")
