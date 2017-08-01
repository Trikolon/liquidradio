const path = require('path');
const BabiliPlugin = require("babili-webpack-plugin");

module.exports = {
    entry: './js/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve("./public/", 'dist'),
        publicPath: "/dist/"
    },
    plugins: [
        new BabiliPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env', 'es2015']
                    }
                }
            }
        ]
    },
    devtool: 'source-map',
    resolve: {
        alias: {
            vue$: "vue/dist/vue.esm.js"
        }
    }
};