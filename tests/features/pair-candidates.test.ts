import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Monitored } from "@/features/detection/models/monitored.js";
import type { Position } from "@/features/detection/models/position.js";
import { pairCandidatesBruteForce } from "@/features/detection/pair-candidates.js";

function position(
    id: number,
    latitude: number,
    longitude: number,
    extras: Partial<Monitored> = {},
): Position {
    return {
        monitored: {
            id,
            factionId: null,
            hasProtectiveMeasure: false,
            restrictedMonitorIds: [],
            ...extras,
        },
        timestamp: "2024-01-01 00:05:15",
        latitude,
        longitude,
    };
}

describe("pairCandidatesBruteForce", () => {
    it("returns only pairs strictly closer than 20 meters", () => {
        const closeA = position(4, -31.93195, -40.61438);
        const closeB = position(6, -31.93187, -40.61435);
        const far = position(1, -25.59386, -73.96319);

        const candidates = pairCandidatesBruteForce([closeA, closeB, far]);

        assert.equal(candidates.length, 1);
        assert.deepEqual(
            [candidates[0]!.a.monitored.id, candidates[0]!.b.monitored.id],
            [4, 6],
        );
        assert.equal(candidates[0]!.distanceMeters, 9.33522817789823);
    });

    it("does not emit a pair with itself or reversed duplicates", () => {
        const a = position(1, 0, 0);
        const b = position(2, 0, 0.00001);

        const candidates = pairCandidatesBruteForce([a, b]);

        assert.equal(candidates.length, 1);
        assert.equal(candidates[0]!.a.monitored.id, 1);
        assert.equal(candidates[0]!.b.monitored.id, 2);
    });

    it("returns no candidates when everyone is far apart", () => {
        const candidates = pairCandidatesBruteForce([
            position(1, 0, 0),
            position(2, 1, 1),
            position(3, -1, -1),
        ]);

        assert.deepEqual(candidates, []);
    });
});
