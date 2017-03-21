const path = require('path');
const NotifierPlugin = require('webpack-notifier');

module.exports = function(env) {
    return {
        entry: './src/index.ts',

        output: {
            filename: env === 'prod' ? 'glider.min.js' : 'glider.js',
            path: path.join(__dirname, 'build'),
            library: 'glider'
        },

        module: {
            rules: [
                {
                    loader: 'ts-loader',
                    test: /\.(js|ts)$/,
                    exclude: /node_modules/
                },
                {
                    loader: 'tslint-loader',
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    options: {
                        emitErrors: true
                    }
                },
                {
                    loader: 'raw-loader',
                    test: /\.(fsh|vsh)$/,
                    exclude: /node_modules/
                }
            ]
        },

        resolve: {
            extensions: ['.ts', '.js']
        },

        devServer: {
            publicPath: '/build'
        },

        devtool: env === 'prod' ? 'source-map' : 'inline-source-map',

        plugins: [
            new NotifierPlugin({
                title: 'Glider'
            })
        ]
    }
}