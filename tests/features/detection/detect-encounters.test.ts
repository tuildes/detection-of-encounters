import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { detectEncounters } from "../../../src/features/detection/detect-encounters.js";
import { EncounterType } from "../../../src/features/detection/models/encounter.js";
import type { Encounter } from "../../../src/features/detection/models/encounter.js";
import type { Monitored } from "../../../src/features/detection/models/monitored.js";
import type { Position } from "../../../src/features/detection/models/position.js";
import { parseDataset } from "../../../src/features/detection/parse-dataset.js";

const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../..",
);

function position(
    id: number,
    timestamp: string,
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
        timestamp,
        latitude,
        longitude,
    };
}

interface OfficialEncounter {
    tipo: string;
    monitoradosEncontro: [number, number];
    timestamp: string;
    posicoes: Record<string, { lat: number; lon: number }>;
    distanciaMetros: number;
}

function encounterKey(encounter: {
    type: string;
    monitoredIds: [number, number];
    timestamp: string;
}): string {
    const [left, right] = [...encounter.monitoredIds].sort((a, b) => a - b);
    return `${encounter.timestamp}|${encounter.type}|${left}-${right}`;
}

describe("detectEncounters", () => {
    it("groups by timestamp so far pairs at different times are ignored", () => {
        const encounters = detectEncounters([
            position(1, "2024-01-01 00:00:00", 0, 0),
            position(2, "2024-01-01 00:00:05", 0, 0),
        ]);

        assert.deepEqual(encounters, []);
    });

    it("builds classified encounters for a close pair in the same timestamp", () => {
        const encounters = detectEncounters([
            position(7, "2024-01-01 00:36:00", -13.02054, -46.40609, {
                factionId: 1,
            }),
            position(8, "2024-01-01 00:36:00", -13.02046, -46.40609, {
                factionId: 1,
            }),
        ]);

        assert.equal(encounters.length, 1);
        assert.equal(encounters[0]!.type, EncounterType.Faction);
        assert.deepEqual(encounters[0]!.monitoredIds, [7, 8]);
        assert.equal(encounters[0]!.distanceMeters, 8.895594131622975);
    });

    it("matches respostas1.json for dataset1", async () => {
        const positions = await parseDataset(
            path.join(repoRoot, "data/inputs/dataset1.txt"),
        );
        const expected = JSON.parse(
            await readFile(
                path.join(repoRoot, "data/expected/respostas1.json"),
                "utf8",
            ),
        ) as OfficialEncounter[];

        const actual = detectEncounters(positions);

        assert.equal(actual.length, expected.length);

        const actualByKey = new Map(
            actual.map((encounter) => [
                encounterKey({
                    type: encounter.type,
                    monitoredIds: encounter.monitoredIds,
                    timestamp: encounter.timestamp,
                }),
                encounter,
            ]),
        );

        for (const official of expected) {
            const key = encounterKey({
                type: official.tipo,
                monitoredIds: official.monitoradosEncontro,
                timestamp: official.timestamp,
            });
            const found = actualByKey.get(key);
            assert.ok(found, `missing encounter ${key}`);
            assert.equal(found.distanceMeters, official.distanciaMetros);
            assertPositionsMatch(found, official);
        }
    });
});

function assertPositionsMatch(
    actual: Encounter,
    official: OfficialEncounter,
): void {
    for (const [id, point] of Object.entries(official.posicoes)) {
        assert.ok(actual.positions[id], `missing position for id ${id}`);
        assert.equal(actual.positions[id]!.lat, point.lat);
        assert.equal(actual.positions[id]!.lon, point.lon);
    }
}
