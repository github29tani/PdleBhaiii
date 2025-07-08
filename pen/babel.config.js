module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Module resolver for web compatibility
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@': './',
          '^react-native$': 'react-native-web',
          'react-native-svg': 'react-native-svg-web',
        },
        extensions: [
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.mjs',
          '.cjs',
          '.web.js',
          '.web.tsx',
          '.android.js',
          '.ios.js',
        ]
      }],
      
      // Reanimated plugin should be last
      'react-native-reanimated/plugin'
    ]
  };
};
