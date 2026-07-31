#!/usr/bin/env python3
"""Build the Full Body Sticker Slot 01 hero without regenerating product pixels."""

from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[3]
PRODUCT_DIR = ROOT / "product-gallery" / "full-body-sticker"
OUTPUT_DIR = PRODUCT_DIR / "outputs"

MASTER_SOURCE = (
    PRODUCT_DIR
    / "references"
    / "current-gallery"
    / "full-body-single-cutout-current-hero.webp"
)
PRINT_SOURCE = (
    PRODUCT_DIR
    / "references"
    / "print-artwork"
    / "full-body-1_50in-3-designs.webp"
)
SCENE_BASE = OUTPUT_DIR / "full-body-sticker-slot-01-hero-angled-v2.png"
EDGE_REFERENCE = (
    PRODUCT_DIR
    / "references"
    / "current-gallery"
    / "full-body-sticker-post-01-edge-reference.png"
)

MASTER_CUTOUT = OUTPUT_DIR / "full-body-sticker-blue-romper-master-cutout.png"
FLAT_ARTWORK = OUTPUT_DIR / "full-body-sticker-1design-flat-artwork-v1.png"
FINAL_COMPOSITE = (
    OUTPUT_DIR / "full-body-sticker-slot-01-hero-angled-v3-pixel-preserved.png"
)
POLISHED_MASTER = (
    OUTPUT_DIR / "full-body-sticker-blue-romper-master-cutout-v2-clean-dieline.png"
)
POLISHED_ARTWORK = OUTPUT_DIR / "full-body-sticker-1design-flat-artwork-v2-polished.png"
POLISHED_COMPOSITE = (
    OUTPUT_DIR / "full-body-sticker-slot-01-hero-angled-v4-polished.png"
)

CANVAS_SIZE = 3000
BABY_HEIGHT = 440

# Position map measured from the authoritative 1942 x 2616 print-artwork source.
GRID_CENTERS = (
    ((300, 565), (620, 565), (960, 565), (1280, 565), (1600, 565)),
    ((300, 1060), (620, 1060), (950, 1060), (1280, 1060), (1600, 1060)),
    ((300, 1560), (620, 1560), (960, 1560), (1280, 1560), (1600, 1560)),
    ((300, 2050), (620, 2050), (960, 2050), (1280, 2050), (1600, 2050)),
)

# Front-surface corners measured from the approved 1254 x 1254 angled composition.
SCENE_QUAD_1254 = (
    (269, 131),
    (975, 137),
    (957, 1178),
    (261, 1144),
)

# The high-resolution print face stays inside Image 1's photographed sheet edge.
# The narrow inset preserves its natural rounded corners, thickness and edge highlight.
POLISHED_SCENE_QUAD_1254 = (
    (298, 154),
    (992, 154),
    (955, 1184),
    (253, 1114),
)


def extract_master_cutout() -> Image.Image:
    """Remove the warm paper background while retaining the printed white border."""
    source = Image.open(MASTER_SOURCE).convert("RGB")
    width, height = source.size
    pixels = source.load()
    mask = Image.new("L", source.size, 0)
    mask_pixels = mask.load()

    for y in range(height):
        for x in range(width):
            red, green, blue = pixels[x, y]
            is_warm_paper = (
                175 <= red <= 242
                and 170 <= green <= 230
                and 165 <= blue <= 224
                and 3 <= red - green <= 28
                and -2 <= green - blue <= 20
                and max(red, green, blue) - min(red, green, blue) <= 42
            )
            if not is_warm_paper:
                mask_pixels[x, y] = 255

    mask = mask.filter(ImageFilter.MedianFilter(7))
    mask = mask.filter(ImageFilter.MaxFilter(13))
    mask = mask.filter(ImageFilter.MinFilter(9))
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))

    # The source is a fixed approved reference; restricting the known subject area
    # prevents isolated paper fibers from entering the alpha mask.
    subject_region = Image.new("L", source.size, 0)
    ImageDraw.Draw(subject_region).rectangle((480, 150, 1125, 1450), fill=255)
    mask = ImageChops.multiply(mask, subject_region)

    bounds = mask.getbbox()
    if not bounds:
        raise RuntimeError("The approved blue-romper cutout could not be isolated.")

    rgba = source.convert("RGBA")
    rgba.putalpha(mask)
    cutout = rgba.crop(bounds)
    cutout.save(MASTER_CUTOUT, "PNG", optimize=True)
    return cutout


def remove_existing_sticker_border(sticker: Image.Image) -> Image.Image:
    """Keep the baby pixels and remove the source's irregular white/gray border."""
    rgba = sticker.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    exterior = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def is_exterior_candidate(x: int, y: int) -> bool:
        red, green, blue, alpha = pixels[x, y]
        neutral = max(red, green, blue) - min(red, green, blue) <= 30
        return alpha < 24 or (neutral and min(red, green, blue) >= 150)

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if exterior[index] or not is_exterior_candidate(x, y):
            return
        exterior[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x > 0:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y > 0:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    subject_alpha = Image.new("L", rgba.size, 0)
    alpha_pixels = subject_alpha.load()
    source_alpha = rgba.getchannel("A").load()
    for y in range(height):
        for x in range(width):
            if not exterior[y * width + x] and source_alpha[x, y] >= 24:
                alpha_pixels[x, y] = source_alpha[x, y]

    subject_alpha = subject_alpha.filter(ImageFilter.GaussianBlur(0.65))
    bounds = subject_alpha.getbbox()
    if not bounds:
        raise RuntimeError("The baby subject could not be separated from its border.")

    rgba.putalpha(subject_alpha)
    return rgba.crop(bounds)


def build_clean_dieline_sticker(subject: Image.Image) -> Image.Image:
    """Create one uniform white offset and one restrained outer keyline."""
    ratio = BABY_HEIGHT / subject.height
    resized = subject.resize(
        (round(subject.width * ratio), BABY_HEIGHT), Image.Resampling.LANCZOS
    )
    padding = 32
    sticker = Image.new(
        "RGBA",
        (resized.width + padding * 2, resized.height + padding * 2),
        (255, 255, 255, 0),
    )
    subject_layer = Image.new("RGBA", sticker.size, (255, 255, 255, 0))
    subject_layer.alpha_composite(resized, (padding, padding))
    subject_alpha = subject_layer.getchannel("A")

    # Gaussian expansion produces round, visually even offsets around fingers/hair.
    white_offset = (
        subject_alpha.filter(ImageFilter.GaussianBlur(8.0))
        .point(lambda value: 255 if value >= 18 else 0)
        .filter(ImageFilter.GaussianBlur(0.7))
    )
    keyline_outer = white_offset.filter(ImageFilter.MaxFilter(5))
    keyline_alpha = ImageChops.subtract(keyline_outer, white_offset).point(
        lambda value: round(value * 0.48)
    )

    keyline = Image.new("RGBA", sticker.size, (207, 203, 198, 0))
    keyline.putalpha(keyline_alpha)
    white = Image.new("RGBA", sticker.size, (255, 255, 255, 0))
    white.putalpha(white_offset)

    sticker.alpha_composite(keyline)
    sticker.alpha_composite(white)
    sticker.alpha_composite(subject_layer)
    sticker.save(POLISHED_MASTER, "PNG", optimize=True)
    return sticker


def load_font(size: int) -> ImageFont.FreeTypeFont:
    """Use a macOS font that contains both Korean and Latin glyphs."""
    candidates = (
        Path("/System/Library/Fonts/AppleSDGothicNeo.ttc"),
        Path("/System/Library/Fonts/Supplemental/AppleGothic.ttf"),
        Path("/System/Library/Fonts/HelveticaNeue.ttc"),
    )
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def place_sticker(
    canvas: Image.Image, sticker: Image.Image, center: tuple[int, int]
) -> None:
    """Place one identical sticker instance with a restrained die-cut keyline."""
    ratio = BABY_HEIGHT / sticker.height
    resized = sticker.resize(
        (round(sticker.width * ratio), BABY_HEIGHT), Image.Resampling.LANCZOS
    )

    alpha = resized.getchannel("A")
    expanded = alpha.filter(ImageFilter.MaxFilter(5))
    outline_alpha = ImageChops.subtract(expanded, alpha).point(lambda value: value // 2)
    outlined = Image.new("RGBA", resized.size, (165, 165, 165, 0))
    outlined.putalpha(outline_alpha)

    left = round(center[0] - resized.width / 2)
    top = round(center[1] - resized.height / 2)
    canvas.alpha_composite(outlined, (left, top))
    canvas.alpha_composite(resized, (left, top))


def build_flat_artwork(sticker: Image.Image) -> Image.Image:
    """Preserve header/footer pixels and replace only the central sticker field."""
    artwork = Image.open(PRINT_SOURCE).convert("RGBA")
    draw = ImageDraw.Draw(artwork)

    # Remove the mixed-design field and source crop marks.
    draw.rectangle((108, 325, 1832, 2380), fill=(255, 255, 255, 255))
    draw.rectangle((0, 0, 1942, 78), fill=(255, 255, 255, 255))
    draw.rectangle((0, 0, 108, 2616), fill=(255, 255, 255, 255))
    draw.rectangle((1833, 0, 1942, 2616), fill=(255, 255, 255, 255))
    draw.rectangle((0, 2540, 1942, 2616), fill=(255, 255, 255, 255))

    # Replace only the approved product-line text while retaining the source logo,
    # divider, order row, footer icons, footer copy and QR.
    draw.rectangle((980, 105, 1815, 250), fill=(255, 255, 255, 255))
    header_font = load_font(34)
    order_font = load_font(33)
    ink = (45, 45, 45, 255)
    draw.text(
        (1808, 143),
        "태오 · 1.5in / 38mm · 1 design(s) · White Matte",
        font=header_font,
        fill=ink,
        anchor="ra",
    )
    draw.text(
        (1808, 198),
        "Order: — | date: 2026-05-17",
        font=order_font,
        fill=ink,
        anchor="ra",
    )

    for row in GRID_CENTERS:
        for center in row:
            place_sticker(artwork, sticker, center)

    artwork.save(FLAT_ARTWORK, "PNG", optimize=True)
    return artwork


def build_polished_flat_artwork(sticker: Image.Image) -> Image.Image:
    """Build the same approved layout with the clean-dieline master."""
    artwork = Image.open(PRINT_SOURCE).convert("RGBA")
    draw = ImageDraw.Draw(artwork)
    draw.rectangle((108, 325, 1832, 2380), fill=(255, 255, 255, 255))
    draw.rectangle((0, 0, 1942, 78), fill=(255, 255, 255, 255))
    draw.rectangle((0, 0, 108, 2616), fill=(255, 255, 255, 255))
    draw.rectangle((1833, 0, 1942, 2616), fill=(255, 255, 255, 255))
    draw.rectangle((0, 2540, 1942, 2616), fill=(255, 255, 255, 255))
    draw.rectangle((980, 105, 1815, 250), fill=(255, 255, 255, 255))

    header_font = load_font(34)
    order_font = load_font(33)
    ink = (45, 45, 45, 255)
    draw.text(
        (1808, 143),
        "태오 · 1.5in / 38mm · 1 design(s) · White Matte",
        font=header_font,
        fill=ink,
        anchor="ra",
    )
    draw.text(
        (1808, 198),
        "Order: — | date: 2026-05-17",
        font=order_font,
        fill=ink,
        anchor="ra",
    )

    for row in GRID_CENTERS:
        for center in row:
            left = round(center[0] - sticker.width / 2)
            top = round(center[1] - sticker.height / 2)
            artwork.alpha_composite(sticker, (left, top))

    artwork.save(POLISHED_ARTWORK, "PNG", optimize=True)
    return artwork


def solve_linear_system(matrix: list[list[float]], values: list[float]) -> list[float]:
    """Solve an 8 x 8 system with Gaussian elimination."""
    size = len(values)
    augmented = [matrix[row][:] + [values[row]] for row in range(size)]

    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        if abs(divisor) < 1e-12:
            raise RuntimeError("Perspective transform is singular.")
        augmented[column] = [value / divisor for value in augmented[column]]

        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            augmented[row] = [
                current - factor * pivot_value
                for current, pivot_value in zip(augmented[row], augmented[column])
            ]

    return [augmented[row][-1] for row in range(size)]


def perspective_coefficients(
    destination: tuple[tuple[float, float], ...],
    source: tuple[tuple[float, float], ...],
) -> tuple[float, ...]:
    """Return Pillow coefficients mapping output coordinates to source coordinates."""
    matrix: list[list[float]] = []
    values: list[float] = []
    for (x, y), (u, v) in zip(destination, source):
        matrix.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        values.append(u)
        matrix.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        values.append(v)
    return tuple(solve_linear_system(matrix, values))


def build_final_composite(artwork: Image.Image) -> Image.Image:
    """Project the exact artwork onto the approved physical-sheet composition."""
    scene = Image.open(SCENE_BASE).convert("RGB")
    scene = scene.resize((CANVAS_SIZE, CANVAS_SIZE), Image.Resampling.LANCZOS)

    scale = CANVAS_SIZE / 1254
    destination = tuple(
        (round(x * scale), round(y * scale)) for x, y in SCENE_QUAD_1254
    )
    source = (
        (0, 0),
        (artwork.width - 1, 0),
        (artwork.width - 1, artwork.height - 1),
        (0, artwork.height - 1),
    )

    # Rounded A5 face prevents the transformed artwork from covering the real edge.
    rounded_mask = Image.new("L", artwork.size, 0)
    ImageDraw.Draw(rounded_mask).rounded_rectangle(
        (0, 0, artwork.width - 1, artwork.height - 1), radius=42, fill=255
    )
    artwork = artwork.copy()
    artwork.putalpha(ImageChops.multiply(artwork.getchannel("A"), rounded_mask))

    coefficients = perspective_coefficients(destination, source)
    warped = artwork.transform(
        (CANVAS_SIZE, CANVAS_SIZE),
        Image.Transform.PERSPECTIVE,
        coefficients,
        resample=Image.Resampling.BICUBIC,
        fillcolor=(255, 255, 255, 0),
    )

    # Reapply only broad physical-sheet illumination, not the old generated details.
    broad_light = scene.convert("L").filter(ImageFilter.GaussianBlur(150))
    broad_light = broad_light.point(lambda value: max(232, min(255, 230 + value // 10)))
    light_rgb = Image.merge("RGB", (broad_light, broad_light, broad_light))
    modulated_rgb = ImageChops.multiply(warped.convert("RGB"), light_rgb)
    modulated = modulated_rgb.convert("RGBA")
    modulated.putalpha(warped.getchannel("A"))

    result = scene.convert("RGBA")
    result.alpha_composite(modulated)
    result = result.convert("RGB")
    result.save(FINAL_COMPOSITE, "PNG", dpi=(300, 300), optimize=True)
    return result


def build_polished_composite(artwork: Image.Image) -> Image.Image:
    """Combine Image 1's natural sheet edge with the polished high-res print face."""
    scene = Image.open(EDGE_REFERENCE).convert("RGB")
    scene = scene.resize((CANVAS_SIZE, CANVAS_SIZE), Image.Resampling.LANCZOS)

    scale = CANVAS_SIZE / 1254
    destination = tuple(
        (round(x * scale), round(y * scale)) for x, y in POLISHED_SCENE_QUAD_1254
    )
    source = (
        (0, 0),
        (artwork.width - 1, 0),
        (artwork.width - 1, artwork.height - 1),
        (0, artwork.height - 1),
    )

    rounded_mask = Image.new("L", artwork.size, 0)
    ImageDraw.Draw(rounded_mask).rounded_rectangle(
        (0, 0, artwork.width - 1, artwork.height - 1), radius=38, fill=255
    )
    artwork = artwork.copy()
    artwork.putalpha(ImageChops.multiply(artwork.getchannel("A"), rounded_mask))

    coefficients = perspective_coefficients(destination, source)
    warped = artwork.transform(
        (CANVAS_SIZE, CANVAS_SIZE),
        Image.Transform.PERSPECTIVE,
        coefficients,
        resample=Image.Resampling.BICUBIC,
        fillcolor=(255, 255, 255, 0),
    )
    warped.putalpha(warped.getchannel("A").filter(ImageFilter.GaussianBlur(0.45)))

    # Transfer restrained broad illumination without copying the old low-res artwork.
    broad_light = scene.convert("L").filter(ImageFilter.GaussianBlur(170))
    broad_light = broad_light.point(lambda value: max(235, min(255, 232 + value // 11)))
    light_rgb = Image.merge("RGB", (broad_light, broad_light, broad_light))
    modulated_rgb = ImageChops.multiply(warped.convert("RGB"), light_rgb)
    modulated = modulated_rgb.convert("RGBA")
    modulated.putalpha(warped.getchannel("A"))

    result = scene.convert("RGBA")
    result.alpha_composite(modulated)
    result = result.convert("RGB")
    result.save(POLISHED_COMPOSITE, "PNG", dpi=(300, 300), optimize=True)
    return result


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sticker = extract_master_cutout()
    artwork = build_flat_artwork(sticker)
    final = build_final_composite(artwork)
    subject = remove_existing_sticker_border(sticker)
    polished_sticker = build_clean_dieline_sticker(subject)
    polished_artwork = build_polished_flat_artwork(polished_sticker)
    polished_final = build_polished_composite(polished_artwork)
    print(f"Master cutout: {MASTER_CUTOUT} ({sticker.width} x {sticker.height})")
    print(f"Flat artwork: {FLAT_ARTWORK} ({artwork.width} x {artwork.height})")
    print(f"Final composite: {FINAL_COMPOSITE} ({final.width} x {final.height})")
    print(
        f"Polished master: {POLISHED_MASTER} "
        f"({polished_sticker.width} x {polished_sticker.height})"
    )
    print(
        f"Polished artwork: {POLISHED_ARTWORK} "
        f"({polished_artwork.width} x {polished_artwork.height})"
    )
    print(
        f"Polished composite: {POLISHED_COMPOSITE} "
        f"({polished_final.width} x {polished_final.height})"
    )


if __name__ == "__main__":
    main()
