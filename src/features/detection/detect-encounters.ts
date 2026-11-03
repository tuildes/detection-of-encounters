import { classifyEncounter } from "./classify-encounter.js";
import type { Encounter } from "./models/encounter.js";
import type { Position } from "./models/position.js";
import { iterateTimestampBuckets } from "./parse-dataset.js";
import { pairCandidatesBruteForce } from "./pair-candidates.js";

export interface DetectEncountersStats {
    encounters: Encounter[];
    positionCount: number;
    bucketSize: number;
    timestampCount: number;
}

export function detectEncounters(positions: Position[]): Encounter[] {
    return detectEncountersOnePass(positions).encounters;
}

export async function detectEncountersFromDataset(filePath: string): Promise<DetectEncountersStats> {
    const encounters: Encounter[] = [];
    let positionCount = 0;
    let timestampCount = 0;
    let bucketSize = 0;
    let expectedBucketSize: number | null = null;

    for await (const bucket of iterateTimestampBuckets(filePath)) {
        const validated = validateBucketSize(bucket, expectedBucketSize, filePath);
        expectedBucketSize = validated.expectedBucketSize;
        bucketSize = expectedBucketSize;

        positionCount += bucket.length;
        timestampCount += 1;
        appendBucketEncounters(encounters, bucket);
    }

    if (timestampCount === 0) {
        throw new Error(`Dataset has no data rows: ${filePath}`);
    }

    return { encounters, positionCount, bucketSize, timestampCount };
}

function detectEncountersOnePass(positions: Position[]): DetectEncountersStats {
    const encounters: Encounter[] = [];
    let expectedBucketSize: number | null = null;
    let bucket: Position[] = [];
    let timestampCount = 0;
    let bucketSize = 0;

    const flush = (): void => {
        if (bucket.length === 0) {
            return;
        }

        const validated = validateBucketSize(bucket, expectedBucketSize, "<memory>");
        expectedBucketSize = validated.expectedBucketSize;
        bucketSize = expectedBucketSize;
        timestampCount += 1;
        appendBucketEncounters(encounters, bucket);
        bucket = [];
    };

    for (const position of positions) {
        const currentTimestamp = bucket[0]?.timestamp;

        if (bucket.length === 0 || currentTimestamp === position.timestamp) {
            if (
                expectedBucketSize !== null &&
                bucket.length >= expectedBucketSize
            ) {
                throw new Error(
                    `Timestamp ${position.timestamp} exceeds fixed bucket size ${expectedBucketSize}`,
                );
            }
            bucket.push(position);
            continue;
        }

        flush();
        bucket.push(position);
    }

    flush();

    return {
        encounters,
        positionCount: positions.length,
        bucketSize,
        timestampCount,
    };
}

function validateBucketSize(
    bucket: Position[],
    expectedBucketSize: number | null,
    source: string,
): { expectedBucketSize: number } {
    if (bucket.length === 0) {
        throw new Error(`Empty timestamp bucket in ${source}`);
    }

    if (expectedBucketSize === null) {
        return { expectedBucketSize: bucket.length };
    }

    if (bucket.length !== expectedBucketSize) {
        const timestamp = bucket[0]!.timestamp;
        throw new Error(
            `Timestamp ${timestamp} has ${bucket.length} rows, expected ${expectedBucketSize} (${source})`,
        );
    }

    return { expectedBucketSize };
}

function appendBucketEncounters(
    encounters: Encounter[],
    bucket: Position[],
): void {
    for (const candidate of pairCandidatesBruteForce(bucket)) {
        encounters.push(
            toEncounter(candidate.a, candidate.b, candidate.distanceMeters),
        );
    }
}

function toEncounter(
    a: Position,
    b: Position,
    distanceMeters: number,
): Encounter {
    const idA = a.monitored.id;
    const idB = b.monitored.id;
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
