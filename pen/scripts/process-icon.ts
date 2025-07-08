import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function processIcon() {
  try {
    if (!fs.existsSync('./source-icon.png')) {
      console.error('Error: source-icon.png not found!');
      console.log('Please save your icon as source-icon.png in the project root first.');
      process.exit(1);
    }

    // First resize the input icon to 716x716
    const resizedIcon = await sharp('./source-icon.png')
      .resize(716, 716)
      .toBuffer();

    // Create a 1024x1024 canvas with purple background and place the icon
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 147, g: 112, b: 219, alpha: 1 } // Light purple background
      }
    })
      .composite([
        {
          input: resizedIcon,
          gravity: 'center'
        }
      ])
      .png()
      .toFile('./source-icon-processed.png');

    console.log('Icon processed successfully! 🎉');
    console.log('Now run: npm run generate-icons source-icon-processed.png');
  } catch (error) {
    console.error('Error processing icon:', error);
  }
}

processIcon();
