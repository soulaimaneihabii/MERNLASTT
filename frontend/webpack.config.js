module.exports = {
  // your other config...
  module: {
    rules: [
      // your other rules...
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: /node_modules/,  // <---- disable warnings for node_modules
      },
    ],
  },
};
