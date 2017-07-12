const path = require('path');

module.exports = {
    entry: './js/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve("./public/", 'dist'),
        publicPath: "/dist/"
    },
    module: {
        loaders: [
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"},
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    devServer: {
        contentBase: path.join(".", "public"),
        compress: true,
        port: 8080
    },
    resolve: {
        alias: {
            vue$: "vue/dist/vue.common.js"
        }
    }

};