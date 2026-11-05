module.exports = {
  preset: 'jest-expo',
  testTimeout: 15000,
  moduleNameMapper: {
    '^lucide-react-native/icons/(.*)$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1.js',
  },
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/lib/items.js',
    'src/services/pantry.js',
    'src/components/ItemForm.jsx',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/tests/firestore.rules.test.js'],
};
