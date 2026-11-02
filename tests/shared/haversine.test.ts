import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { haversineMeters } from "@/shared/haversine.js";

describe("haversineMeters", () => {
    it("matches the official respostas1 sample pair distance", () => {
        const distance = haversineMeters(
            -31.93195,
            -40.61438,
            -31.93187,
            -40.61435,
        );

        assert.equal(distance, 9.33522817789823);
    });

    it("returns 0 for the same point", () => {
        assert.equal(haversineMeters(0, 0, 0, 0), 0);
    });
});
