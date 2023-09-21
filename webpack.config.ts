// eslint-disable-next-line import/default
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import path from 'path';
import { Configuration } from 'webpack';

const config = async (env: any): Promise<Configuration> => ({
  mode: env.production ? 'production' : 'development',
  target: 'node',
  context: path.resolve(__dirname, 'src'),
  entry: {
    main: path.resolve(__dirname, 'src/index.ts'),
  },
  module: {
    rules: [
      {
        exclude: /(node_modules)/,
        test: /\.[tj]sx?$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              target: 'es2021',
              loose: false,
              parser: {
                syntax: 'typescript',
                decorators: false,
                dynamicImport: true,
              },
            },
          },
        },
      },
    ],
  },

  output: {
    filename: '[name].node.js',
    path: path.resolve(__dirname, 'dist'),
  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'config/**/*.json', to: '.' }],
    }),
    new ForkTsCheckerWebpackPlugin({
      issue: {
        include: [{ file: '**/*.{ts,tsx}' }],
      },
      typescript: { configFile: path.join(process.cwd(), 'tsconfig.json') },
    }),
    new ESLintPlugin({
      extensions: ['.ts', '.tsx'],
    }),
  ],

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    // handle resolving "rootDir" paths
    modules: [path.resolve(process.cwd(), 'src'), 'node_modules'],
    unsafeCache: true,
  },
  ignoreWarnings: [
    {
      // Ignoring this warning since it occurs in the view rendering code, and we are not using it
      module: /node_modules\/express\/lib\/view\.js/,
      message: /the request of a dependency is an expression/,
    },
  ],
});

export default config;
