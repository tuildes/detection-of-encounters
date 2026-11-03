export enum EncounterType {
    Generic = "generico",
    Faction = "faccao",
    Protective = "protetiva",
}

export interface EncounterPosition {
    lat: number;
    lon: number;
}

export interface Encounter {
    type: EncounterType;
    monitoredIds: [number, number];
    timestamp: string;
    positions: Record<string, EncounterPosition>;
    distanceMeters: number;
}
