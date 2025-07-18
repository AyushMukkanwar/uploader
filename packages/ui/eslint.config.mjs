import config from '../../packages/eslint-config/index.js';
import reactInternal from '../../packages/eslint-config/react-internal.js';
import globals from 'globals';

export default [
  ...config,
  ...reactInternal,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json'],
        },
      },
    },
  },
];