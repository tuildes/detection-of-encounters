import type { Monitored } from "./monitored.js";

export interface Position {
    monitored: Monitored;
    timestamp: string;
    latitude: number;
    longitude: number;
}
