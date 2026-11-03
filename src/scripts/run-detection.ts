import path from "node:path";
import {
    detectEncountersFromDataset,
    writeEncountersJson,
} from "@/features/index.js";
import { REPO_ROOT } from "@/shared/repo-root.js";

async function main(): Promise<void> {
    const inputArg = process.argv[2];
    if (!inputArg) {
        console.error(
            "Usage: pnpm detect <input.txt> [output.json]\n" +
                "Example: pnpm detect data/inputs/dataset1.txt",
        );
        process.exitCode = 1;
        return;
    }

    const inputPath = path.resolve(inputArg);
    const outputPath = path.resolve(
        process.argv[3] ?? defaultOutputPath(inputPath),
    );

    const startedAt = performance.now();
    const { encounters, positionCount, bucketSize, timestampCount } =
        await detectEncountersFromDataset(inputPath);
    await writeEncountersJson(outputPath, encounters);
    const elapsedMs = performance.now() - startedAt;

    console.log(`Input:       ${inputPath}`);
    console.log(`Output:      ${outputPath}`);
    console.log(`Positions:   ${positionCount}`);
    console.log(`Timestamps:  ${timestampCount}`);
    console.log(`Bucket size: ${bucketSize}`);
    console.log(`Encounters:  ${encounters.length}`);
    console.log(`Elapsed:     ${(elapsedMs / 1000).toFixed(3)}s`);
}

function defaultOutputPath(inputPath: string): string {
    const baseName = path.basename(inputPath, path.extname(inputPath));
    return path.join(REPO_ROOT, "output", `${baseName}.json`);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
