import sharp from 'sharp';

async function createBaseIcon() {
  try {
    // Create a 1024x1024 purple background
    const background = await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 147, g: 112, b: 219, alpha: 1 }
      }
    }).png().toBuffer();

    // Create a white notepad shape
    const notepad = Buffer.from(`
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <path d="M256 128h512c44.2 0 80 35.8 80 80v608c0 44.2-35.8 80-80 80H256c-44.2 0-80-35.8-80-80V208c0-44.2 35.8-80 80-80z" 
              fill="white"/>
        <path d="M320 256h384v64H320zM320 384h384v64H320zM320 512h384v64H320zM320 640h256v64H320z" 
              fill="#e0e0e0"/>
        <!-- Binding rings -->
        <circle cx="256" cy="256" r="32" fill="#808080"/>
        <circle cx="256" cy="384" r="32" fill="#808080"/>
        <circle cx="256" cy="512" r="32" fill="#808080"/>
        <circle cx="256" cy="640" r="32" fill="#808080"/>
      </svg>
    `);

    // Combine background and notepad
    await sharp(background)
      .composite([
        {
          input: notepad,
          gravity: 'center'
        }
      ])
      .png()
      .toFile('./source-icon.png');

    console.log('Base icon created successfully! 🎉');
    console.log('Now run: npm run process-icon');
  } catch (error) {
    console.error('Error creating base icon:', error);
  }
}

createBaseIcon();
