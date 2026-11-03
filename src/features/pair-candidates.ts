import { ENCOUNTER_RADIUS_METERS } from "@/shared/constants.js";
import { haversineMeters } from "@/shared/haversine.js";
import type { Position } from "./models/position.js";

/** ~meters per degree of latitude (also used as equator scale for longitude). */
const METERS_PER_DEGREE = 111_320;

export interface EncounterCandidate {
    a: Position;
    b: Position;
    distanceMeters: number;
}

export function pairCandidates(positions: Position[]): EncounterCandidate[] {
    if (positions.length < 2) {
        return [];
    }

    const grid = new Map<string, number[]>();

    for (let index = 0; index < positions.length; index += 1) {
        const position = positions[index]!;
        const key = cellKey(position.latitude, position.longitude);
        const cell = grid.get(key);
        if (cell) {
            cell.push(index);
        } else {
            grid.set(key, [index]);
        }
    }

    const candidates: EncounterCandidate[] = [];

    for (let i = 0; i < positions.length; i += 1) {
        const a = positions[i]!;
        const [cellX, cellY] = cellCoords(a.latitude, a.longitude);

        for (let deltaX = -1; deltaX <= 1; deltaX += 1) {
            for (let deltaY = -1; deltaY <= 1; deltaY += 1) {
                const neighbors = grid.get(cellKeyFromCoords(cellX + deltaX, cellY + deltaY));
                if (!neighbors) {
                    continue;
                }

                for (const j of neighbors) {
                    if (j <= i) {
                        continue;
                    }

                    const b = positions[j]!;
                    const distanceMeters = haversineMeters(
                        a.latitude,
                        a.longitude,
                        b.latitude,
                        b.longitude,
                    );

                    if (distanceMeters < ENCOUNTER_RADIUS_METERS) {
                        candidates.push({ a, b, distanceMeters });
                    }
                }
            }
        }
    }

    return candidates;
}

export function pairCandidatesBruteForce(
    positions: Position[],
): EncounterCandidate[] {
    const candidates: EncounterCandidate[] = [];

    for (let i = 0; i < positions.length; i += 1) {
        const a = positions[i]!;

        for (let j = i + 1; j < positions.length; j += 1) {
            const b = positions[j]!;
            const distanceMeters = haversineMeters(
                a.latitude,
                a.longitude,
                b.latitude,
                b.longitude,
            );

            if (distanceMeters < ENCOUNTER_RADIUS_METERS) {
                candidates.push({ a, b, distanceMeters });
            }
        }
    }

    return candidates;
}

function cellCoords(latitude: number, longitude: number): [number, number] {
    const latRad = (latitude * Math.PI) / 180;
    const metersX =
        longitude * METERS_PER_DEGREE * Math.cos(latRad);
    const metersY = latitude * METERS_PER_DEGREE;

    return [
        Math.floor(metersX / ENCOUNTER_RADIUS_METERS),
        Math.floor(metersY / ENCOUNTER_RADIUS_METERS),
    ];
}

function cellKey(latitude: number, longitude: number): string {
    const [x, y] = cellCoords(latitude, longitude);
    return cellKeyFromCoords(x, y);
}

function cellKeyFromCoords(x: number, y: number): string {
    return `${x},${y}`;
}
