const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './app.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'app.js',
    },
    mode: 'development',
}