import puppeteer from 'puppeteer';
import * as marked from 'marked';
import fs from 'fs';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

export async function markdownToPNG(inputPath: string, outputPath: string): Promise<void> {
    // Read markdown file
    const markdownContent = fs.readFileSync(inputPath, 'utf-8');

    // only show everything before "%%%%%"
    const contentBeforeSeparator = markdownContent.split('%%%%%')[0];

    // Convert markdown to HTML
    const parse = new marked.Marked(
        markedHighlight({
            langPrefix: 'hljs language-',
            highlight: (code, lang) => {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            }
        }),
    ).parse;
    const htmlContent = parse(contentBeforeSeparator) as string;

    // Launch headless browser
    const browser = await puppeteer.launch({
        defaultViewport: {
            height: 1080,
            width: 1920
        },
        // headless: false
    });
    const page = await browser.newPage();

    // Set content to HTML
    await page.setContent(htmlContent);

    // add styles from "styles.css" to the page
    await page.addStyleTag({ path: 'styles.css' });

    // wait for the page be fully loaded
    await page.waitForNetworkIdle();

    // wait for the scripts to be executed (0.25s)
    await new Promise(resolve => setTimeout(resolve, 250));

    // Get the size of the content
    const contentSize = await page.evaluate(() => {
        const body = document.querySelector('body');
        return {
            width: body?.offsetWidth,
            height: body?.offsetHeight
        };
    });

    // // wait for user to press enter in browser
    // await page.evaluate(() => {
    //     return new Promise(resolve => {
    //         window.addEventListener('keypress', (event: KeyboardEvent) => {
    //             if (event.key === 'Enter') {
    //                 resolve(1);
    //             }
    //         });
    //     });
    // });

    // Set viewport size
    await page.setViewport(contentSize as any);

    // Take a screenshot as PNG
    const pngData = await page.screenshot({ type: 'png' });

    // save the PNG to the output path
    fs.writeFileSync(outputPath, pngData);

    // Close the browser
    await browser.close();
}
