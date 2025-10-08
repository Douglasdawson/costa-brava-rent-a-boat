import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, parse } from 'path';

const IMAGES_DIR = './client/src/assets/generated_images';

async function convertToWebP() {
  console.log('🖼️  Converting PNG images to WebP format...\n');
  
  const files = await readdir(IMAGES_DIR);
  const pngFiles = files.filter(file => file.endsWith('.png'));
  
  let totalOriginalSize = 0;
  let totalWebPSize = 0;
  
  for (const file of pngFiles) {
    const inputPath = join(IMAGES_DIR, file);
    const { name } = parse(file);
    const outputPath = join(IMAGES_DIR, `${name}.webp`);
    
    // Get original size
    const originalStats = await stat(inputPath);
    const originalSize = originalStats.size;
    totalOriginalSize += originalSize;
    
    // Convert to WebP
    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath);
    
    // Get new size
    const webpStats = await stat(outputPath);
    const webpSize = webpStats.size;
    totalWebPSize += webpSize;
    
    const reduction = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
    console.log(`✓ ${file}`);
    console.log(`  ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(webpSize / 1024 / 1024).toFixed(2)}MB (-${reduction}%)`);
  }
  
  const totalReduction = ((totalOriginalSize - totalWebPSize) / totalOriginalSize * 100).toFixed(1);
  console.log(`\n📊 Total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB → ${(totalWebPSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`🎉 Reduced by ${totalReduction}% (saved ${((totalOriginalSize - totalWebPSize) / 1024 / 1024).toFixed(2)}MB)`);
}

convertToWebP().catch(console.error);
