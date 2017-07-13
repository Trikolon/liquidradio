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
        loaders: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    devtool: 'source-map',
    resolve: {
        alias: {
            vue$: "vue/dist/vue.common.js"
        }
    }
};