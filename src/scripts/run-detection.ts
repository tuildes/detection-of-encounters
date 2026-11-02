import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    detectEncounters,
    parseDataset,
    writeEncountersJson,
} from "../features/detection/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..",);

async function main(): Promise<void> {
    const args = process.argv.slice(2).filter((arg) => arg !== "--");
    const inputArg = args[0];
    if (!inputArg) {
        console.error(
            "Usage: pnpm detect -- <input.txt> [output.json]\n" +
                "Example: pnpm detect -- data/inputs/dataset1.txt",
        );
        process.exitCode = 1;
        return;
    }

    const inputPath = path.resolve(inputArg);
    const outputPath = path.resolve(args[1] ?? defaultOutputPath(inputPath));

    const startedAt = performance.now();
    const positions = await parseDataset(inputPath);
    const encounters = detectEncounters(positions);
    await writeEncountersJson(outputPath, encounters);
    const elapsedMs = performance.now() - startedAt;

    console.log(`Input:      ${inputPath}`);
    console.log(`Output:     ${outputPath}`);
    console.log(`Positions:  ${positions.length}`);
    console.log(`Encounters: ${encounters.length}`);
    console.log(`Elapsed:    ${(elapsedMs / 1000).toFixed(3)}s`);
}

function defaultOutputPath(inputPath: string): string {
    const baseName = path.basename(inputPath, path.extname(inputPath));
    return path.join(repoRoot, "output", `${baseName}.json`);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
