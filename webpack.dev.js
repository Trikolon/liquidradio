const path = require('path');

module.exports = {
    entry: './js/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve("./public/", 'dist'),
        publicPath: "/dist/"
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: path.join(".", "public"),
        compress: true,
        port: 8080
    },
    resolve: {
        alias: {
            vue$: "vue/dist/vue.esm.js"
        }
    }

};