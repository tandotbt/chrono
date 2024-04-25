import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/global.ts",
  output: {
    dir: '../build/content-scripts',
    format: 'iife'
  },
  plugins: [nodeResolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs({ include: /node_modules/ })]
};
