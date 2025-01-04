import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateFavicons() {
  const sourceImage = join(__dirname, '../public/android-chrome-1024x1024.png');
  const outputDir = join(__dirname, '../public');

  // Favicon sizes needed
  const sizes = {
    'favicon.ico': [16, 32],
    'favicon-16x16.png': [16],
    'favicon-32x32.png': [32],
    'favicon-48x48.png': [48],
    'apple-touch-icon.png': [180],
    'android-chrome-192x192.png': [192],
    'android-chrome-512x512.png': [512]
  };

  try {
    for (const [filename, dimensions] of Object.entries(sizes)) {
      const outputPath = join(outputDir, filename);
      
      // Skip if trying to write to source file
      if (outputPath === sourceImage) {
        console.log(`Skipping source file: ${filename}`);
        continue;
      }

      if (filename === 'favicon.ico') {
        // Create ICO file with multiple sizes
        const buffers = await Promise.all(
          dimensions.map(size =>
            sharp(sourceImage)
              .resize(size, size)
              .toFormat('png')
              .toBuffer()
          )
        );
        
        await fs.writeFile(outputPath, Buffer.concat(buffers));
      } else {
        // Create PNG files
        await sharp(sourceImage)
          .resize(dimensions[0], dimensions[0])
          .toFile(outputPath);
      }
    }
    console.log('Favicon files generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons(); 