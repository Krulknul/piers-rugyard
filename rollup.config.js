import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/main.ts',  // Path to your main TypeScript file
  output: {
    file: 'dist/bundle.js',  // Output file
    format: 'es',       // Output format (es, cjs, iife, etc.)
  },
  plugins: [typescript()],
};
