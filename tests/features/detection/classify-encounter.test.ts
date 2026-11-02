import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyEncounter } from "../../../src/features/detection/classify-encounter.js";
import { EncounterType } from "../../../src/features/detection/models/encounter.js";
import type { Monitored } from "../../../src/features/detection/models/monitored.js";

function monitored(partial: Partial<Monitored> & Pick<Monitored, "id">): Monitored {
    return {
        factionId: null,
        hasProtectiveMeasure: false,
        restrictedMonitorIds: [],
        ...partial,
    };
}

describe("classifyEncounter", () => {
    it("returns protetiva when either side lists the other as restriction", () => {
        const victim = monitored({
            id: 9,
            hasProtectiveMeasure: true,
            restrictedMonitorIds: [10],
        });
        const aggressor = monitored({ id: 10 });

        assert.equal(
            classifyEncounter(victim, aggressor),
            EncounterType.Protective,
        );
        assert.equal(
            classifyEncounter(aggressor, victim),
            EncounterType.Protective,
        );
    });

    it("returns faccao when both share the same non-null faction", () => {
        const a = monitored({ id: 7, factionId: 1 });
        const b = monitored({ id: 8, factionId: 1 });

        assert.equal(classifyEncounter(a, b), EncounterType.Faction);
    });

    it("returns generico when there is no restriction and no shared faction", () => {
        const a = monitored({ id: 4 });
        const b = monitored({ id: 6 });

        assert.equal(classifyEncounter(a, b), EncounterType.Generic);
    });

    it("does not treat two null factions as the same faction", () => {
        const a = monitored({ id: 1, factionId: null });
        const b = monitored({ id: 2, factionId: null });

        assert.equal(classifyEncounter(a, b), EncounterType.Generic);
    });

    it("prefers protetiva over faccao when both apply", () => {
        const a = monitored({
            id: 1,
            factionId: 1,
            hasProtectiveMeasure: true,
            restrictedMonitorIds: [2],
        });
        const b = monitored({ id: 2, factionId: 1 });

        assert.equal(classifyEncounter(a, b), EncounterType.Protective);
    });
});
