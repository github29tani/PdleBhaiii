import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const ICON_SIZES = {
  ios: [
    { size: 1024, name: 'icon-store.png' },     // App Store
    { size: 180, name: 'icon-60@3x.png' },      // iPhone
    { size: 167, name: 'icon-83.5@2x.png' },    // iPad Pro
    { size: 152, name: 'icon-76@2x.png' },      // iPad
    { size: 120, name: 'icon-60@2x.png' },      // iPhone
    { size: 80, name: 'icon-40@2x.png' },       // Spotlight
    { size: 76, name: 'icon-76.png' },          // iPad
    { size: 40, name: 'icon-40.png' },          // Spotlight
  ],
  android: [
    { size: 512, name: 'icon-512.png' },        // Play Store
    { size: 432, name: 'icon-432.png' },        // xxhdpi
    { size: 324, name: 'icon-324.png' },        // xhdpi
    { size: 216, name: 'icon-216.png' },        // hdpi
    { size: 162, name: 'icon-162.png' },        // mdpi
  ],
};

async function generateIcons(sourceIcon: string) {
  // Create output directories
  const outputBase = path.join(__dirname, '../assets/images');
  const outputIos = path.join(outputBase, 'ios');
  const outputAndroid = path.join(outputBase, 'android');

  await fs.mkdir(outputIos, { recursive: true });
  await fs.mkdir(outputAndroid, { recursive: true });

  // Generate base icon
  await sharp(sourceIcon)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(outputBase, 'icon.png'));

  // Generate iOS icons
  for (const icon of ICON_SIZES.ios) {
    await sharp(sourceIcon)
      .resize(icon.size, icon.size)
      .png()
      .toFile(path.join(outputIos, icon.name));
    console.log(`Generated iOS icon: ${icon.name} (${icon.size}x${icon.size})`);
  }

  // Generate Android icons
  for (const icon of ICON_SIZES.android) {
    await sharp(sourceIcon)
      .resize(icon.size, icon.size)
      .png()
      .toFile(path.join(outputAndroid, icon.name));
    console.log(`Generated Android icon: ${icon.name} (${icon.size}x${icon.size})`);
  }

  // Generate adaptive icon background and foreground
  await sharp(sourceIcon)
    .resize(432, 432)
    .png()
    .toFile(path.join(outputBase, 'adaptive-icon.png'));

  // Generate splash icon
  const splashBackground = await sharp({
    create: {
      width: 1242,
      height: 2436,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  }).png().toBuffer();

  const resizedIcon = await sharp(sourceIcon)
    .resize(800, 800)
    .toBuffer();

  await sharp(splashBackground)
    .composite([
      {
        input: resizedIcon,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(outputBase, 'splash-icon.png'));

  console.log('Icon generation complete! 🎉');
}

// Check if source icon path is provided
const sourceIcon = process.argv[2];
if (!sourceIcon) {
  console.error('Please provide the path to your source icon:');
  console.error('npm run generate-icons <path-to-icon>');
  process.exit(1);
}

generateIcons(sourceIcon).catch(console.error);
