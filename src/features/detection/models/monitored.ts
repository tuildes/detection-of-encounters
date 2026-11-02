export interface Monitored {
    id: number;
    factionId: number | null;
    hasProtectiveMeasure: boolean;
    restrictedMonitorIds: number[];
}
