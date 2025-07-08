// Delegate to default transformers for all files
const svgTransformer = require('react-native-svg-transformer');
const upstreamTransformer = require('metro-react-native-babel-transformer');

module.exports = {
  transform({ src, filename, options }) {
    // Use SVG transformer for .svg files
    if (filename.endsWith('.svg')) {
      return svgTransformer.transform({ src, filename, options });
    }

    // Ensure import.meta is transformed in *all* files, including node_modules
    const babelOptions = {
      ...options,
      plugins: [
        [require.resolve('babel-plugin-transform-import-meta'), { useBabelRuntime: false }],
        ...(options?.plugins || [])
      ],
    };

    return upstreamTransformer.transform({ src, filename, options: babelOptions });
  },
};
