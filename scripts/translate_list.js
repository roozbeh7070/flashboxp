import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to wait
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to translate a word using Google Translate free API
async function translateWord(word) {
    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=${encodeURIComponent(word)}`);
        if (!res.ok) {
            throw new Error(`HTTP status ${res.status}`);
        }
        const json = await res.json();
        return json[0][0][0];
    } catch (e) {
        console.error(`Error translating "${word}":`, e.message);
        return null;
    }
}

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node scripts/translate_list.js <input_txt_file> <output_json_file>');
        process.exit(1);
    }

    const inputFile = path.resolve(args[0]);
    const outputFile = path.resolve(args[1]);

    if (!fs.existsSync(inputFile)) {
        console.error(`Input file not found: ${inputFile}`);
        process.exit(1);
    }

    console.log(`Reading words from: ${inputFile}...`);
    const content = fs.readFileSync(inputFile, 'utf-8');
    const words = content
        .split('\n')
        .map(w => w.trim())
        .filter(w => w.length > 0);

    console.log(`Found ${words.length} words to translate.`);

    const results = [];
    const concurrencyLimit = 5; // Translate 5 words at a time
    const waitTimeBetweenBatches = 80; // Wait 80ms between batch requests to prevent 429 Too Many Requests

    for (let i = 0; i < words.length; i += concurrencyLimit) {
        const batch = words.slice(i, i + concurrencyLimit);
        console.log(`Translating batch ${i / concurrencyLimit + 1}/${Math.ceil(words.length / concurrencyLimit)} (${i} to ${i + batch.length - 1})...`);

        const promises = batch.map(async (word) => {
            let translation = await translateWord(word);
            // Retry once if failed
            if (!translation) {
                await delay(500);
                translation = await translateWord(word);
            }
            return {
                eng: word,
                per: translation || 'ترجمه یافت نشد'
            };
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        await delay(waitTimeBetweenBatches);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Saving translated JSON to: ${outputFile}...`);
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
    console.log('Done! Translation completed successfully.');
}

run();
