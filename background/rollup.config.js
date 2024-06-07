import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/main.ts",
  output: {
    dir: '../build/background',
    format: 'iife'
  },
  plugins: [nodeResolve({
    browser: true,
    preferBuiltins: false,
  }),
  typescript(),
  commonjs({ include: /node_modules/ })]
};
