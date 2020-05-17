module.exports = {
  verbose: true,
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  moduleDirectories: ['node_modules', 'packages/frontend'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testMatch: ['<rootDir>/**/*.test.(js|jsx|ts|tsx)'],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
};
