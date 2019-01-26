module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.ts',
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
  },
  resolve: {
    extensions: ['*', '.ts', '.tsx', '.js','.jsx'],
  },
  output: {
    path: `${__dirname}/dist`,
    filename: 'index.js',
    libraryTarget: 'commonjs2',
    library: 'VolumeMeter',
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM"
  }
};
