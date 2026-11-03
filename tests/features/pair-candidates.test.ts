import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Monitored } from "@/features/models/monitored.js";
import type { Position } from "@/features/models/position.js";
import {
    pairCandidates,
    pairCandidatesBruteForce,
} from "@/features/pair-candidates.js";
import { iterateTimestampBuckets } from "@/features/parse-dataset.js";
import { REPO_ROOT } from "@/shared/repo-root.js";
import path from "node:path";

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

function candidateKey(candidate: {
    a: Position;
    b: Position;
    distanceMeters: number;
}): string {
    const idA = candidate.a.monitored.id;
    const idB = candidate.b.monitored.id;
    const [left, right] = idA <= idB ? [idA, idB] : [idB, idA];
    return `${left}-${right}:${candidate.distanceMeters}`;
}

function assertSameCandidates(
    grid: ReturnType<typeof pairCandidates>,
    brute: ReturnType<typeof pairCandidatesBruteForce>,
): void {
    assert.deepEqual(
        [...grid.map(candidateKey)].sort(),
        [...brute.map(candidateKey)].sort(),
    );
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

describe("pairCandidates (spatial grid)", () => {
    it("matches brute force on a mixed near/far bucket", () => {
        const bucket = [
            position(4, -31.93195, -40.61438),
            position(6, -31.93187, -40.61435),
            position(1, -25.59386, -73.96319),
            position(7, -13.02054, -46.40609, { factionId: 1 }),
            position(8, -13.02046, -46.40609, { factionId: 1 }),
        ];

        assertSameCandidates(pairCandidates(bucket), pairCandidatesBruteForce(bucket));
    });

    it("matches brute force across every timestamp bucket of dataset1", async () => {
        for await (const bucket of iterateTimestampBuckets(
            path.join(REPO_ROOT, "data/inputs/dataset1.txt"),
        )) {
            assertSameCandidates(
                pairCandidates(bucket),
                pairCandidatesBruteForce(bucket),
            );
        }
    });

    it("matches brute force across every timestamp bucket of dataset2", async () => {
        for await (const bucket of iterateTimestampBuckets(
            path.join(REPO_ROOT, "data/inputs/dataset2.txt"),
        )) {
            assertSameCandidates(
                pairCandidates(bucket),
                pairCandidatesBruteForce(bucket),
            );
        }
    });
});
