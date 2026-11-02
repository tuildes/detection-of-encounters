import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EncounterType } from "../../../src/features/detection/models/encounter.js";
import type { Encounter } from "../../../src/features/detection/models/encounter.js";
import {
    serializeEncountersJson,
    toOfficialEncounterJson,
} from "../../../src/features/detection/write-encounters-json.js";

const sample: Encounter = {
    type: EncounterType.Faction,
    monitoredIds: [7, 8],
    timestamp: "2024-01-01 00:36:00",
    positions: {
        "7": { lat: -13.02054, lon: -46.40609 },
        "8": { lat: -13.02046, lon: -46.40609 },
    },
    distanceMeters: 8.895594131622975,
};

describe("toOfficialEncounterJson", () => {
    it("maps English domain fields to the official Portuguese schema", () => {
        assert.deepEqual(toOfficialEncounterJson(sample), {
            tipo: "faccao",
            monitoradosEncontro: [7, 8],
            timestamp: "2024-01-01 00:36:00",
            posicoes: {
                "7": { lat: -13.02054, lon: -46.40609 },
                "8": { lat: -13.02046, lon: -46.40609 },
            },
            distanciaMetros: 8.895594131622975,
        });
    });
});

describe("serializeEncountersJson", () => {
    it("serializes an array payload", () => {
        const json = serializeEncountersJson([sample]);
        const parsed = JSON.parse(json) as unknown[];

        assert.equal(parsed.length, 1);
        assert.equal((parsed[0] as { tipo: string }).tipo, "faccao");
    });
});
