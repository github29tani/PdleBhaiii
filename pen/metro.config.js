// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for SVG files
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];
// Disable package exports to prevent Metro from picking ESM files with import.meta
config.resolver.unstable_enablePackageExports = false;
// Use react-native-svg-transformer for SVGs, but chain through custom transformer for all files
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

try {
  // Try to apply NativeWind if available
  const { withNativeWind } = require('nativewind/metro');
  module.exports = withNativeWind(config, { input: './global.css' });
} catch (error) {
  console.warn('NativeWind not found, continuing without it');
  module.exports = config;
}
