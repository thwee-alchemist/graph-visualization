const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/js/graph-visualization.js',
  output: {
    path: path.resolve(__dirname, './dist/'),
    filename: 'graph-visualization.bundle.js'
  },
  target: "web",
  module: {
    rules: [
      // Emscripten JS files define a global. With `exports-loader` we can 
      // load these files correctly (provided the global’s name is the same
      // as the file name).
      {
        test: /core\.js$/,
        loader: "exports-loader"
      },
      // wasm files should not be processed but just be emitted and we want
      // to have their public URL.
      {
        test: /core\.wasm$/,
        loader: "file-loader",
        options: {
          publicPath: "dist/"
        }
      }
    ]
  }
}
