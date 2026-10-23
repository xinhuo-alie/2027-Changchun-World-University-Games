from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
image = Image.open(root / 'web/assets/ice-city-anchored-map.png').convert('RGB')
text = (root / 'web/map-landmarks.js').read_text(encoding='utf-8')
section = text.split('points: {', 1)[1].split('},', 1)[0]
points = re.findall(r'(\w+): \[(\d+)/2048, (\d+)/1152\]', section)
draw = ImageDraw.Draw(image)
font = ImageFont.truetype('arial.ttf', 25)
for id, x, y in points:
    x, y = int(x), int(y)
    draw.ellipse((x-68, y-50, x+68, y+26), outline='#ff365a', width=5)
    draw.ellipse((x-6, y-6, x+6, y+6), fill='#ff365a')
    draw.text((x-65, y-46), id, fill='#a50028', font=font, stroke_width=2, stroke_fill='white')
slots = re.findall(r'\[(\d+)/2048, (\d+)/1152\]', text.split('futureSlots:', 1)[1])
for i, (x, y) in enumerate(slots, 1):
    x, y = int(x), int(y)
    draw.ellipse((x-55, y-42, x+55, y+42), outline='#00dcff', width=5)
    draw.text((x-22, y-18), str(i), fill='#00496b', font=font, stroke_width=2, stroke_fill='white')
image.save(root / 'web/assets/map-anchor-preview.png')
