import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Encounter } from "./models/encounter.js";

/** Official challenge output schema (Portuguese field names). */
export interface OfficialEncounterJson {
    tipo: string;
    monitoradosEncontro: [number, number];
    timestamp: string;
    posicoes: Record<string, { lat: number; lon: number }>;
    distanciaMetros: number;
}

export function toOfficialEncounterJson(
    encounter: Encounter,
): OfficialEncounterJson {
    return {
        tipo: encounter.type,
        monitoradosEncontro: encounter.monitoredIds,
        timestamp: encounter.timestamp,
        posicoes: encounter.positions,
        distanciaMetros: encounter.distanceMeters,
    };
}

export function serializeEncountersJson(encounters: Encounter[]): string {
    const payload = encounters.map(toOfficialEncounterJson);
    return `${JSON.stringify(payload, null, 2)}\n`;
}

export async function writeEncountersJson(
    filePath: string,
    encounters: Encounter[],
): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, serializeEncountersJson(encounters), "utf8");
}
