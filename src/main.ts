import { getSortedFiles } from "./files";
import { markdownToPNG } from "./svg";
import { collect } from './voice_collect';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import * as readline from 'readline';

async function renderImage(file: string, base: string) {
    const inputPath = `${base}/${file}`;
    const outputPath = `${base}/.build/image_artifacts/${file.replace('.md', '.png')}`;
    await markdownToPNG(inputPath, outputPath);

    console.log(`Rendered ${inputPath} to ${outputPath}`);
}

async function renderImages(files: string[], base: string) {
    // make sure the output directory exists
    if (!fs.existsSync(`${base}/.build/image_artifacts`)) {
        fs.mkdirSync(`${base}/.build/image_artifacts`, { recursive: true });
    }

    for (const file of files) {
        await renderImage(file, base);
    }

    console.log('Rendered all files');
}

async function generateAudio(file: string, base: string) {
    {
        const inputPath = `${base}/${file}`;
        const outputPath = `${base}/.build/voice_artifacts/${file.replace('.md', '.txt')}`;
        const voiceText = await collect(inputPath);

        fs.writeFileSync(outputPath, voiceText);
    }

    {
        const inputPath = `${base}/.build/voice_artifacts/${file.replace('.md', '.txt')}`;

        // the command is `python3.11 voice.py <inputPath>
        const execPromise = util.promisify(exec);

        await execPromise(`PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True python3.11 voice.py ${inputPath}`, {
            env: {
                PYTORCH_CUDA_ALLOC_CONF: "expandable_segments:True",
                ...process.env
            },
            shell: '/bin/bash'
        });

        console.log(`Converted ${inputPath} to audio`);
    }
}

async function generateAudios(files: string[], base: string) {
    // make sure the output directory exists
    if (!fs.existsSync(`${base}/.build/voice_artifacts`)) {
        fs.mkdirSync(`${base}/.build/voice_artifacts`, { recursive: true });
    }

    // make sure the output directory exists
    if (!fs.existsSync(`${base}/.build/audio_artifacts`)) {
        fs.mkdirSync(`${base}/.build/audio_artifacts`, { recursive: true });
    }

    // convert all the voice lines to audio
    for (const file of files) {
        await generateAudio(file, base);
    }
}

async function mergeArtifact(file: string, base: string) {
    const imagePath = `${base}/.build/image_artifacts/${file.replace('.md', '.png')}`;
    const audioPath = `${base}/.build/audio_artifacts/${file.replace('.md', '.wav')}`;
    const outputPath = `${base}/.build/video_artifacts/${file.replace('.md', '.mp4')}`;

    const execPromise = util.promisify(exec);

    // Get the duration of the audio file using ffprobe
    const ffprobeCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${audioPath}`;
    const ffprobeOutput = await execPromise(ffprobeCommand);
    const audioDuration = parseFloat(ffprobeOutput.stdout);

    // The command to merge the audio and image files using ffmpeg
    const ffmpegCommand = `ffmpeg -loop 1 -i ${imagePath} -i ${audioPath} -c:v libvpx-vp9 -c:a aac -strict experimental -b:a 192k -shortest -t ${audioDuration + 1} ${outputPath} -y`;
    await execPromise(ffmpegCommand);

    console.log(`Merged ${imagePath} and ${audioPath} to ${outputPath}`);
}

async function mergeArtifacts(files: string[], base: string) {
    // make sure the output directory exists
    if (!fs.existsSync(`${base}/.build/video_artifacts`)) {
        fs.mkdirSync(`${base}/.build/video_artifacts`, { recursive: true });
    }

    // merge the audios and images to videos
    for (const file of files) {
        await mergeArtifact(file, base);
    }

    console.log('Merged all videos');
}

async function concatenateVideos(files: string[], base: string) {
    // make sure the output directory exists
    if (!fs.existsSync(`${base}/.build`)) {
        fs.mkdirSync(`${base}/.build`, { recursive: true });
    }

    // write a file that contains the list of all the videos
    const videoList = files.map(file => `file video_artifacts/${file.replace('.md', '.mp4')}`).join('\n');
    fs.writeFileSync(`${base}/.build/videos.txt`, videoList);

    // concatenate all the videos together
    const execPromise = util.promisify(exec);
    await execPromise(`ffmpeg -f concat -safe 0 -i ${base}/.build/videos.txt -c copy ${base}/output.mp4 -y`);

    console.log('Concatenated all videos');
}

async function regenerateChapter(file_num: string, files: string[], base: string) {
    // find the file in files that starts with file_num
    const file = files.find(f => f.startsWith(file_num));

    if (!file) {
        throw new Error(`File not found: ${file_num}. Please enter a two digit number.`);
    }

    await renderImage(file, base);
    await generateAudio(file, base);
    await mergeArtifact(file, base);

    console.log(`Regenerated chapter ${file_num}`);
}

async function generateVideo(files: string[], base: string) {
    await renderImages(files, base);
    await generateAudios(files, base);
    await mergeArtifacts(files, base);
    await concatenateVideos(files, base);

    console.log('Generated video');
}

async function readLineFromStdin(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`${question}>`, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function main() {

    // first cmd arg is the video name
    const videoName = process.argv.length > 2 ? process.argv[2] : '';

    if (videoName.length === 0) {
        throw new Error(`Please enter a video name.`);
    }

    const base = `videos/${videoName}`;

    // check if the base directory exists
    if (!fs.existsSync(base)) {
        console.log(`Directory not found: ${base}. Please enter a valid directory.`);

        process.exit(1);
    }

    while (true) {
        const subcommand = await readLineFromStdin(`${base}$Enter a command (render, regen, join, exit)`);

        const files = await getSortedFiles(base);

        if (subcommand === 'render') {
            await generateVideo(files, base);
        } else if (subcommand === 'regen') {
            const file_num = process.argv.length > 3 ? process.argv[3] : '';

            if (file_num.length !== 2) {
                throw new Error(`Invalid file number: ${file_num}. Please enter a two digit number.`);
            }

            await regenerateChapter(file_num, files, base);
        } else if (subcommand === 'join') {
            await concatenateVideos(files, base);
        } else if (subcommand === 'exit') {
            process.exit(0);
        } else {
            console.error(`Available subcommands: render, regen, join`);
        }
    }

}

main().catch(console.error);