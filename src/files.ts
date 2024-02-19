import fs from 'fs';

export async function getSortedFiles(directoryPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                reject(err);
                return;
            }

            const filteredFiles = files.filter(file => /^\d{2}_.*\.md$/.test(file));
            const sortedFiles = filteredFiles.sort((a, b) => {
                const prefixA = parseInt(a.substring(0, 2));
                const prefixB = parseInt(b.substring(0, 2));
                return prefixA - prefixB;
            });

            resolve(sortedFiles);
        });
    });
}
