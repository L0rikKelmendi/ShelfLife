const easProjectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'cc2f0ebd-d783-4773-8685-6f5d528b7b03';

module.exports = {
  expo: {
    name: 'ShelfLife',
    owner: 'lorikkelmendi',
    slug: 'shelflife',
    scheme: 'shelflife',
    version: '1.2.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    ios: { supportsTablet: true, bundleIdentifier: 'com.shelflife.pantry' },
    android: {
      versionCode: 3,
      package: 'com.shelflife.pantry',
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundColor: '#EAF0DF',
      },
      blockedPermissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.CAMERA',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
      output: 'single',
      name: 'ShelfLife — a little fresher, every day',
    },
    plugins: [
      'expo-router',
      'expo-font',
      ['expo-notifications', { color: '#3D6246', defaultChannel: 'pantry-reminders-v2' }],
      ...(process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME
        ? [
            [
              '@react-native-google-signin/google-signin',
              { iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME },
            ],
          ]
        : []),
    ],
    extra: { eas: { projectId: easProjectId } },
  },
};
