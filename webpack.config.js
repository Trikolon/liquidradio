const path = require('path');
const webpack = require('webpack');
const BabiliPlugin = require("babili-webpack-plugin");

module.exports = {
    entry: './src/app.js',
    output: {
        path: path.resolve("./public/", 'dist'),
        publicPath: "/dist/",
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    loaders: {}
                }
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    devtool: '#eval-source-map',
    devServer: {
        contentBase: path.join(".", "public"),
        historyApiFallback: true,
        noInfo: true
    },
    performance: {
        hints: false
    },
    resolve: {
        alias: {
            vue$: "vue/dist/vue.esm.js"
        }
    }
};

if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = '#source-map';
    // http://vue-loader.vuejs.org/en/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new BabiliPlugin(),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ])
}
