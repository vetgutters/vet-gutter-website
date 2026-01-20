/**
 * Image Compression Script
 * Compresses all images in assets/photos to web-optimized sizes
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const photosDir = path.join(__dirname, 'assets', 'photos');
const outputDir = path.join(__dirname, 'assets', 'photos-optimized');

// Create output directory
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Configuration
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;

async function compressImage(inputPath, outputPath) {
    const ext = path.extname(inputPath).toLowerCase();
    const filename = path.basename(inputPath);

    try {
        const inputStats = fs.statSync(inputPath);
        const inputSize = inputStats.size;

        let pipeline = sharp(inputPath)
            .resize(MAX_WIDTH, null, {
                withoutEnlargement: true,
                fit: 'inside'
            });

        if (ext === '.jpg' || ext === '.jpeg') {
            await pipeline
                .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
                .toFile(outputPath);
        } else if (ext === '.png') {
            // Check if image has transparency, if not convert to JPEG
            const metadata = await sharp(inputPath).metadata();
            if (metadata.hasAlpha && metadata.channels === 4) {
                // Keep as PNG but compress
                await pipeline
                    .png({ quality: PNG_QUALITY, compressionLevel: 9 })
                    .toFile(outputPath);
            } else {
                // Convert to JPEG for better compression
                const jpegPath = outputPath.replace('.png', '.jpg');
                await pipeline
                    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
                    .toFile(jpegPath);
                outputPath = jpegPath;
            }
        } else {
            // Skip non-image files
            console.log(`⏭️  Skipped: ${filename} (unsupported format)`);
            return null;
        }

        const outputStats = fs.statSync(outputPath);
        const outputSize = outputStats.size;
        const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

        console.log(`✅ ${filename}: ${(inputSize / 1024 / 1024).toFixed(2)}MB → ${(outputSize / 1024 / 1024).toFixed(2)}MB (${savings}% smaller)`);

        return { input: inputSize, output: outputSize };
    } catch (err) {
        console.error(`❌ Error processing ${filename}:`, err.message);
        return null;
    }
}

async function main() {
    console.log('🖼️  Image Compression Script');
    console.log('━'.repeat(50));
    console.log(`Input: ${photosDir}`);
    console.log(`Output: ${outputDir}`);
    console.log(`Max width: ${MAX_WIDTH}px`);
    console.log(`JPEG quality: ${JPEG_QUALITY}%`);
    console.log('━'.repeat(50));

    const files = fs.readdirSync(photosDir).filter(f =>
        /\.(jpg|jpeg|png)$/i.test(f)
    );

    console.log(`\nProcessing ${files.length} images...\n`);

    let totalInput = 0;
    let totalOutput = 0;

    for (const file of files) {
        const inputPath = path.join(photosDir, file);
        const outputPath = path.join(outputDir, file);

        const result = await compressImage(inputPath, outputPath);
        if (result) {
            totalInput += result.input;
            totalOutput += result.output;
        }
    }

    console.log('\n' + '━'.repeat(50));
    console.log(`📊 TOTAL:`);
    console.log(`   Before: ${(totalInput / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   After:  ${(totalOutput / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Saved:  ${((totalInput - totalOutput) / 1024 / 1024).toFixed(2)} MB (${((1 - totalOutput / totalInput) * 100).toFixed(1)}%)`);
    console.log('\n✨ Optimized images saved to: assets/photos-optimized/');
    console.log('💡 To use: Replace contents of assets/photos with photos-optimized');
}

main().catch(console.error);
