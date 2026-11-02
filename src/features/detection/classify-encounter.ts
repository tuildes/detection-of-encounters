import { EncounterType } from "./models/encounter.js";
import type { Monitored } from "./models/monitored.js";

export function classifyEncounter(monitoredA: Monitored, monitoredB: Monitored): EncounterType {
    if (monitoredA.restrictedMonitorIds.includes(monitoredB.id) ||
        monitoredB.restrictedMonitorIds.includes(monitoredA.id)) {

        return EncounterType.Protective;
    }

    if (monitoredA.factionId !== null &&
        monitoredB.factionId !== null &&
        monitoredA.factionId === monitoredB.factionId) {

        return EncounterType.Faction;
    }

    return EncounterType.Generic;
}

