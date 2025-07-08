import { getDefaultConfig } from '@expo/metro-config';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

// Create __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: resolve(__dirname, 'node_modules/react-native-svg-transformer'),
  getTransformOptions: () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts.filter(ext => ext !== 'svg'), 'db'],
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

export default config;
