import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    parseDataLine,
    splitDatasetFields,
} from "@/features/parse-dataset.js";

describe("splitDatasetFields", () => {
    it("splits semicolon fields and strips quotes", () => {
        const fields = splitDatasetFields(
            '9;;"2024-01-01 00:00:00";1.64046;-69.53947;true;"10"',
        );

        assert.deepEqual(fields, [
            "9",
            "",
            "2024-01-01 00:00:00",
            "1.64046",
            "-69.53947",
            "true",
            "10",
        ]);
    });
});

describe("parseDataLine", () => {
    it("maps a regular monitored row", () => {
        const position = parseDataLine(
            '7;1;"2024-01-01 00:00:00";-13.06443;-46.56289;false;',
            8,
            "fixture.txt",
        );

        assert.deepEqual(position, {
            monitored: {
                id: 7,
                factionId: 1,
                hasProtectiveMeasure: false,
                restrictedMonitorIds: [],
            },
            timestamp: "2024-01-01 00:00:00",
            latitude: -13.06443,
            longitude: -46.56289,
        });
    });

    it("maps a protective-measure row with restriction ids", () => {
        const position = parseDataLine(
            '9;;"2024-01-01 00:00:00";1.64046;-69.53947;true;"10"',
            10,
            "fixture.txt",
        );

        assert.equal(position.monitored.factionId, null);
        assert.equal(position.monitored.hasProtectiveMeasure, true);
        assert.deepEqual(position.monitored.restrictedMonitorIds, [10]);
    });
});
