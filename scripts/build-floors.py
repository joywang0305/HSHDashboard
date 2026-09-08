#!/usr/bin/env python3
"""Build kiosk SVGs and geometry for every CAD floor except POT14F."""
from __future__ import annotations

import copy
import sys
from pathlib import Path

from cad_common import ROOT, build_kiosk_floor

FLOORS = [
    {
        "id": "POT4F",
        "const": "POT4F",
        "src": "floorplans/20260828_HSH Project HOME_4F The Peninsula Office Tower_Testfit 03.svg",
        "out_svg": "public/floorplans/pot4f.svg",
        "out_ts": "src/lib/pot4f-geometry.ts",
        "viewbox": {"x": 90, "y": 76, "width": 978, "height": 496},
        "rooms": [
            {"id": "pot4-meeting-west", "name": "West Meeting", "capacity": 5, "seed": (229.1, 163.0)},
            {"id": "pot4-meeting-east", "name": "East Meeting", "capacity": 6, "seed": (712.3, 157.5)},
            {"id": "pot4-meeting-north", "name": "North Meeting", "capacity": 12, "seed": (808.2, 135.8)},
            {"id": "pot4-meeting-a", "name": "Meeting A", "capacity": 4, "seed": (778.9, 224.6)},
            {"id": "pot4-meeting-b", "name": "Meeting B", "capacity": 4, "seed": (836.3, 224.6)},
            {"id": "pot4-phone-booth", "name": "Phone Booth", "capacity": 1, "seed": (690.1, 351.5)},
        ],
    },
    {
        "id": "POT5F",
        "const": "POT5F",
        "src": "floorplans/20260828_HSH Project HOME_5F The Peninsula Office Tower_Testfit.svg",
        "out_svg": "public/floorplans/pot5f.svg",
        "out_ts": "src/lib/pot5f-geometry.ts",
        "viewbox": {"x": 99, "y": 342, "width": 978, "height": 496},
        "rooms": [
            {
                "id": "pot5-meeting",
                "name": "Meeting",
                "capacity": 5,
                "seed": (219.4, 399.8),
                "clip": (167.0, 391.0, 255.0, 472.0),
            },
        ],
    },
    {
        "id": "POT12F",
        "const": "POT12F",
        "src": "floorplans/20260828_HSH Project HOME_12F The Peninsula Office Tower_Testfit 03.svg",
        "out_svg": "public/floorplans/pot12f.svg",
        "out_ts": "src/lib/pot12f-geometry.ts",
        "viewbox": {"x": 147, "y": 262, "width": 1122, "height": 448},
        "rooms": [
            {"id": "pot12-huddle", "name": "Huddle", "capacity": 4, "seed": (480.0, 331.0)},
            {"id": "pot12-phone-n", "name": "North Phone", "capacity": 1, "seed": (772.0, 397.0)},
            {"id": "pot12-interview", "name": "Interview", "capacity": 4, "seed": (751.0, 416.0)},
            {"id": "pot12-focus-n", "name": "Focus A", "capacity": 2, "seed": (534.2, 494.6)},
            {"id": "pot12-focus-s", "name": "Focus B", "capacity": 2, "seed": (533.4, 529.2)},
            {"id": "pot12-meeting-10", "name": "Meeting 10", "capacity": 10, "seed": (631.2, 501.9), "clip": (587.0, 475.0, 688.0, 550.0)},
            {"id": "pot12-meeting-12", "name": "Meeting 12", "capacity": 12, "seed": (750.0, 502.0), "clip": (688.0, 475.0, 830.0, 550.0)},
            {"id": "pot12-meeting-24", "name": "Meeting 24", "capacity": 24, "seed": (701.3, 627.4)},
            {"id": "pot12-phone-e", "name": "East Phone", "capacity": 1, "seed": (1115.0, 566.0)},
        ],
    },
    {
        "id": "SGB8F",
        "const": "SGB8F",
        "src": "floorplans/20260828_HSH Project HOME_8F St George's Building_Testfit 03.svg",
        "out_svg": "public/floorplans/sgb8f.svg",
        "out_ts": "src/lib/sgb8f-geometry.ts",
        "viewbox": {"x": 90, "y": 148, "width": 932, "height": 448},
        "rooms": [
            {
                "id": "sgb8-boardroom",
                "name": "Boardroom",
                "capacity": 20,
                "seed": (593.1, 231.4),
                "clip": (514.0, 159.0, 706.0, 290.0),
            },
            {
                "id": "sgb8-meeting-10",
                "name": "Meeting 10",
                "capacity": 10,
                "seed": (744.6, 257.5),
                "clip": (700.0, 159.0, 815.0, 290.0),
            },
            {
                "id": "sgb8-meeting-6",
                "name": "Meeting 6",
                "capacity": 6,
                "seed": (765.6, 341.2),
                "clip": (722.0, 311.0, 812.0, 391.0),
            },
            {
                "id": "sgb8-phonebooth",
                "name": "Phone Booth",
                "capacity": 1,
                "seed": (469.4, 277.2),
                "clip": (463.0, 262.0, 498.0, 289.0),
            },
            {
                "id": "sgb8-phone-n",
                "name": "Phone N",
                "capacity": 1,
                "seed": (333.0, 343.6),
                "clip": (327.0, 325.0, 373.0, 359.0),
            },
            {
                "id": "sgb8-phone-s",
                "name": "Phone S",
                "capacity": 1,
                "seed": (333.0, 374.2),
                "clip": (327.0, 355.0, 373.0, 390.0),
            },
            {
                "id": "sgb8-phone-e",
                "name": "Phone E",
                "capacity": 1,
                "seed": (826.0, 438.0),
                "clip": (812.0, 419.0, 843.0, 465.0),
            },
            {
                "id": "sgb8-phone-f",
                "name": "Phone F",
                "capacity": 1,
                "seed": (850.0, 438.0),
                "clip": (841.0, 419.0, 862.0, 465.0),
            },
            {
                "id": "sgb8-west-booth",
                "name": "West Booth",
                "capacity": 1,
                "seed": (264.0, 440.6),
                "clip": (237.0, 422.0, 286.0, 465.0),
            },
        ],
    },
]


def main() -> None:
    wanted = set(sys.argv[1:]) if len(sys.argv) > 1 else {floor["id"] for floor in FLOORS}
    for floor in FLOORS:
        if floor["id"] not in wanted:
            continue
        rooms = copy.deepcopy(floor["rooms"])
        build_kiosk_floor(
            ROOT / floor["src"],
            ROOT / floor["out_svg"],
            ROOT / floor["out_ts"],
            floor["const"],
            floor["viewbox"],
            rooms,
        )


if __name__ == "__main__":
    main()
