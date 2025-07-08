module.exports = {
  expo: {
    plugins: [
      "expo-router",
      "expo-web-browser",
      "expo-font"
    ],
    name: 'PdleBhaii',
    slug: 'pdlebhaii',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'pdlebhaii',
    userInterfaceStyle: 'automatic',
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pdlebhaii.app',
      buildNumber: '1',
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'Allow PdleBhaii to access your photos to upload profile pictures and share images.',
        NSCameraUsageDescription: 'Allow PdleBhaii to access your camera to take photos for your profile.',
        NSUserTrackingUsageDescription: 'This identifier will be used to deliver personalized ads to you.'
      },
      config: {
        usesNonExemptEncryption: false
      },
      associatedDomains: [],
      entitlements: {
        'com.apple.developer.applesignin': ['Default'],
        'com.apple.developer.in-app-payments': ['merchant.com.pdlebhaii.app']
      }
    },
    android: {
      package: 'com.pdlebhaii.app',
      versionCode: 1,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_MEDIA_LOCATION'
      ],

    },
    extra: {
      "eas": {
        "projectId": "9cd7a5e9-da55-47cf-b3dd-2f559b785b8a"
      }
    }
  }
};
