import { classifyEncounter } from "./classify-encounter.js";
import type { Encounter } from "./models/encounter.js";
import type { Position } from "./models/position.js";
import { pairCandidates } from "./pair-candidates.js";

export function detectEncounters(positions: Position[]): Encounter[] {
    const encounters: Encounter[] = [];

    for (const group of groupByTimestamp(positions).values()) {
        for (const candidate of pairCandidates(group)) {
            encounters.push(toEncounter(candidate.a, candidate.b, candidate.distanceMeters));
        }
    }

    return encounters;
}

function groupByTimestamp(positions: Position[]): Map<string, Position[]> {
    const groups = new Map<string, Position[]>();

    for (const position of positions) {
        const existing = groups.get(position.timestamp);
        if (existing) {
            existing.push(position);
            continue;
        }
        groups.set(position.timestamp, [position]);
    }

    return groups;
}

function toEncounter(a: Position, b: Position, distanceMeters: number): Encounter {
    let idA = a.monitored.id;
    let idB = b.monitored.id;

    const monitoredIds: [number, number] =
        idA <= idB ? [idA, idB] : [idB, idA];

    return {
        type: classifyEncounter(a.monitored, b.monitored),
        monitoredIds,
        timestamp: a.timestamp,
        positions: {
            [String(idA)]: { lat: a.latitude, lon: a.longitude },
            [String(idB)]: { lat: b.latitude, lon: b.longitude },
        },
        distanceMeters,
    };
}
