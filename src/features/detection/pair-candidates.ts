import { ENCOUNTER_RADIUS_METERS } from "@/shared/constants.js";
import { haversineMeters } from "@/shared/haversine.js";
import type { Position } from "./models/position.js";

export interface EncounterCandidate {
    a: Position;
    b: Position;
    distanceMeters: number;
}

/**
 * Brute-force pair search for one timestamp bucket.
 * Kept as reference / parity baseline for the sparse-grid implementation.
 */
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
