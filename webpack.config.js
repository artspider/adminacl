const HTMLWebPackPlugin = require('html-webpack-plugin');
const WebpackCdnPlugin = require('webpack-cdn-plugin');


module.exports = {
    entry: './src/main.js',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js'   
    },
    mode: 'production',
    module: {
    rules: [
        {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader', "postcss-loader"],
        },
        {
            test: /\.s[ac]ss$/i,
            use: [
                // Creates `style` nodes from JS strings
                "style-loader",
                // Translates CSS into CommonJS
                "css-loader",
                // Compiles Sass to CSS
                "sass-loader",
            ],
        },
        {
            test: /\.(png|jpg|gif)$/i,
            loader:'file-loader',
            options: {
                name: '[path][name].[ext]',
                outputPath: 'images',
                publicPath: 'images',
                emitFile: true,
                esModule: false
              },
        },
    ],
},
plugins: [
    new HTMLWebPackPlugin({
        template: './src/index.html'
    }),
    new WebpackCdnPlugin({
        modules: [
            {
                name: 'xlsx',
                var: 'XLSX',
                path: 'dist/xlsx.full.min.js'
            },
            {
                name: 'sweetalert',
                var: 'swal',
                path: 'dist/sweetalert.min.js'
            },
        ],
        publicPath: '/node_modules'
    })
    ]
}