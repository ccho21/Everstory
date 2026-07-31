#!/usr/bin/env python3
"""Transfer exact header/footer artwork from a flat sheet onto a 3000px mockup."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


FLAT_HEADER_BOX = (80, 80, 1860, 320)
FLAT_FOOTER_BOX = (80, 2390, 1840, 2585)

# Coordinates measured on the supplied 3000x3000 mockup, ordered:
# top-left, top-right, bottom-right, bottom-left.
MOCKUP_HEADER_QUAD = (
    (699.0, 381.0),
    (2381.0, 388.0),
    (2361.0, 608.0),
    (680.0, 599.0),
)
MOCKUP_FOOTER_QUAD = (
    (567.0, 2518.0),
    (2290.0, 2570.0),
    (2272.0, 2772.0),
    (549.0, 2699.0),
)


def solve_linear_system(matrix: list[list[float]], values: list[float]) -> list[float]:
    """Solve a small square linear system with Gaussian elimination."""
    size = len(values)
    augmented = [row[:] + [value] for row, value in zip(matrix, values)]

    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        if abs(divisor) < 1e-12:
            raise ValueError("Perspective transform is singular")

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
    """Return Pillow coefficients mapping destination pixels back to source pixels."""
    matrix: list[list[float]] = []
    values: list[float] = []

    for (x_dst, y_dst), (x_src, y_src) in zip(destination, source):
        matrix.append(
            [x_dst, y_dst, 1.0, 0.0, 0.0, 0.0, -x_src * x_dst, -x_src * y_dst]
        )
        values.append(x_src)
        matrix.append(
            [0.0, 0.0, 0.0, x_dst, y_dst, 1.0, -y_src * x_dst, -y_src * y_dst]
        )
        values.append(y_src)

    return tuple(solve_linear_system(matrix, values))


def warp_crop(
    crop: Image.Image,
    destination: tuple[tuple[float, float], ...],
    output_size: tuple[int, int],
) -> tuple[Image.Image, Image.Image]:
    """Perspective-warp a crop and its coverage mask to the output canvas."""
    width, height = crop.size
    source = (
        (0.0, 0.0),
        (float(width), 0.0),
        (float(width), float(height)),
        (0.0, float(height)),
    )
    coefficients = perspective_coefficients(destination, source)

    warped = crop.transform(
        output_size,
        Image.Transform.PERSPECTIVE,
        coefficients,
        resample=Image.Resampling.BICUBIC,
        fillcolor=(255, 255, 255),
    )
    coverage = Image.new("L", crop.size, 255).transform(
        output_size,
        Image.Transform.PERSPECTIVE,
        coefficients,
        resample=Image.Resampling.BICUBIC,
        fillcolor=0,
    )
    return warped, coverage.filter(ImageFilter.GaussianBlur(8.0))


def transfer_band(
    base: Image.Image,
    flat: Image.Image,
    source_box: tuple[int, int, int, int],
    destination_quad: tuple[tuple[float, float], ...],
) -> tuple[Image.Image, Image.Image]:
    """Replace one printed band while retaining the mockup's paper lighting."""
    source_crop = flat.crop(source_box).convert("RGB")
    warped, coverage = warp_crop(source_crop, destination_quad, base.size)

    # Downsampling removes the incorrect print while retaining only the card's
    # large-scale highlights, shadows, and warm paper tone.
    lighting_size = (48, 48)
    paper_lighting = (
        base.resize(lighting_size, Image.Resampling.BOX)
        .filter(ImageFilter.GaussianBlur(1.2))
        .resize(base.size, Image.Resampling.BICUBIC)
    )
    relit_artwork = ImageChops.multiply(warped, paper_lighting)
    return Image.composite(relit_artwork, base, coverage), coverage


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--flat", required=True, type=Path)
    parser.add_argument("--mockup", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    flat = Image.open(args.flat).convert("RGB")
    mockup_source = Image.open(args.mockup)
    if mockup_source.size != (3000, 3000):
        raise ValueError(f"Mockup must be 3000x3000, got {mockup_source.size}")
    base = mockup_source.convert("RGB")

    result, header_mask = transfer_band(
        base, flat, FLAT_HEADER_BOX, MOCKUP_HEADER_QUAD
    )
    result, footer_mask = transfer_band(
        result, flat, FLAT_FOOTER_BOX, MOCKUP_FOOTER_QUAD
    )

    # Confirm the complete sticker field between the two bands is byte-identical.
    sticker_field = (0, 685, 3000, 2460)
    sticker_changes = ImageChops.difference(
        base.crop(sticker_field), result.crop(sticker_field)
    )
    if sticker_changes.getbbox() is not None:
        raise RuntimeError("Unexpected pixels changed in the sticker field")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    save_options: dict[str, object] = {"compress_level": 3}
    if "dpi" in mockup_source.info:
        save_options["dpi"] = mockup_source.info["dpi"]
    if "icc_profile" in mockup_source.info:
        save_options["icc_profile"] = mockup_source.info["icc_profile"]
    result.save(args.output, format="PNG", **save_options)

    print(f"saved={args.output}")
    print(f"size={result.width}x{result.height}")
    print(f"mode={result.mode}")


if __name__ == "__main__":
    main()
