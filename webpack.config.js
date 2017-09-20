const path = require("path");
const webpack = require('webpack');
const BabiliPlugin = require("babili-webpack-plugin");
const OfflinePlugin = require("offline-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    context: path.resolve("src"),
    entry: "./index.js",
    output: {
        path: path.resolve('public'),
        publicPath: "/",
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
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html'
        }),
        new CopyWebpackPlugin([
            { from: 'pwa' },
            { from: 'assets'}
        ])
    ]
};

if (process.env.NODE_ENV === 'production') { // only add in production
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
        }),
        new OfflinePlugin({
            caches: {
                main: [
                    "bundle.js",
                    "index.html"
                ]
            },
            autoUpdate: true
        })
    ])
}
else { // Only add in development
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.NamedModulesPlugin()
    ])
}
