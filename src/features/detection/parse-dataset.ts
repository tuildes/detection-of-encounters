import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { Monitored } from "./models/monitored.js";
import type { Position } from "./models/position.js";

const EXPECTED_HEADER =
    "idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida";

/**
 * Stream positions grouped by timestamp (file must be ordered by timestamp).
 * Yields one bucket at a time so callers can process and discard.
 */
export async function* iterateTimestampBuckets(
    filePath: string,
): AsyncGenerator<Position[], void, void> {
    let isHeader = true;
    let lineNumber = 0;
    let bucket: Position[] = [];
    let currentTimestamp: string | null = null;
    let sawData = false;

    const lines = createInterface({
        input: createReadStream(filePath, { encoding: "utf8" }),
        crlfDelay: Infinity,
    });

    for await (const rawLine of lines) {
        lineNumber += 1;
        const line = rawLine.trim();

        if (line.length === 0) {
            continue;
        }

        if (isHeader) {
            assertHeader(line, filePath);
            isHeader = false;
            continue;
        }

        const position = parseDataLine(line, lineNumber, filePath);
        sawData = true;

        if (currentTimestamp === null) {
            currentTimestamp = position.timestamp;
            bucket.push(position);
            continue;
        }

        if (position.timestamp === currentTimestamp) {
            bucket.push(position);
            continue;
        }

        yield bucket;
        bucket = [position];
        currentTimestamp = position.timestamp;
    }

    if (isHeader) {
        throw new Error(`Dataset is empty (no header): ${filePath}`);
    }

    if (!sawData) {
        throw new Error(`Dataset has no data rows: ${filePath}`);
    }

    if (bucket.length > 0) {
        yield bucket;
    }
}

/** Loads the full file into memory — prefer iterateTimestampBuckets / detectEncountersFromDataset. */
export async function parseDataset(filePath: string): Promise<Position[]> {
    const positions: Position[] = [];
    for await (const bucket of iterateTimestampBuckets(filePath)) {
        positions.push(...bucket);
    }
    return positions;
}

function assertHeader(line: string, filePath: string): void {
    if (line !== EXPECTED_HEADER) {
        throw new Error(
            `Unexpected dataset header in ${filePath}:\n got: ${line}\n expected: ${EXPECTED_HEADER}`,
        );
    }
}

export function splitDatasetFields(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i]!;

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === ";" && !inQuotes) {
            fields.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    fields.push(current);
    return fields;
}

export function parseDataLine(line: string, lineNumber: number, filePath: string): Position {
    const fields = splitDatasetFields(line);

    if (fields.length !== 7) {
        throw new Error(
            `Expected 7 fields at ${filePath}:${lineNumber}, got ${fields.length}: ${line}`,
        );
    }

    const [
        idRaw,
        factionRaw,
        timestamp,
        latitudeRaw,
        longitudeRaw,
        protectiveRaw,
        restrictedRaw,
    ] = fields as [string, string, string, string, string, string, string];

    const monitored: Monitored = {
        id: parseInteger(idRaw, "idMonitorado", lineNumber, filePath, true)!,
        factionId: parseInteger(
            factionRaw,
            "faccaoMonitorado",
            lineNumber,
            filePath,
            false,
        ),
        hasProtectiveMeasure: parseBoolean(
            protectiveRaw,
            "medidaProtetiva",
            lineNumber,
            filePath,
        ),
        restrictedMonitorIds: parseIdList(restrictedRaw),
    };

    return {
        monitored,
        timestamp,
        latitude: parseFloatNumber(
            latitudeRaw,
            "latitude",
            lineNumber,
            filePath,
            true,
        )!,
        longitude: parseFloatNumber(
            longitudeRaw,
            "longitude",
            lineNumber,
            filePath,
            true,
        )!,
    };
}

function parseInteger(value: string, field: string, lineNumber: number, filePath: string, isRequired: boolean): number | null {
    if (value.trim() === "") {
        if (isRequired) {
            throw new Error(`Missing ${field} at ${filePath}:${lineNumber}`);
        }
        return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        throw new Error(
            `Invalid ${field} "${value}" at ${filePath}:${lineNumber}`,
        );
    }
    return parsed;
}

function parseFloatNumber(value: string, field: string, lineNumber: number, filePath: string, isRequired: boolean): number | null {
    if (value.trim() === "") {
        if (isRequired) {
            throw new Error(`Missing ${field} at ${filePath}:${lineNumber}`);
        }
        return null;
    }

    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(
            `Invalid ${field} "${value}" at ${filePath}:${lineNumber}`,
        );
    }
    return parsed;
}

function parseBoolean(value: string, field: string, lineNumber: number, filePath: string): boolean {
    if (value === "true") { return true; }
    if (value === "false") { return false; }
    throw new Error(`Invalid ${field} "${value}" at ${filePath}:${lineNumber}`);
}

function parseIdList(value: string): number[] {
    const trimmed = value.trim();
    if (trimmed === "") { return []; }
    return trimmed
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map((part) => Number.parseInt(part, 10))
        .filter((id) => Number.isFinite(id));
}
