import { promises as fs } from 'fs';

export async function collect(path: string): Promise<string> {
    const file = await fs.readFile(path);

    // only show everything after "%%%%%"
    const contentAfterSeparator = file.toString().split('%%%%%')[1];

    return contentAfterSeparator.replace("\n", "").trim().replace("  ", " ");
}