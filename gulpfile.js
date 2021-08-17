"use strict";

const gulp = require("gulp");
const webpack = require("webpack-stream");
const browsersync = require("browser-sync");
const del = require("del");

const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

const plumber = require("gulp-plumber");
const imagemin = require("gulp-imagemin");
const imageminPngquant = require('imagemin-pngquant');
const { plugin } = require("postcss");
const dist = "./dist/";

gulp.task("html-task", () => {
    return gulp
        .src("./src/index.html")
        .pipe(plumber())
        .pipe(gulp.dest(dist))
        .pipe(browsersync.stream());
});

gulp.task("css-task", () => {
    const plugins = [autoprefixer(), cssnano()];
    return gulp
        .src("./src/assets/sass/style.scss")
        .pipe(plumber())
        .pipe(sass())
        .pipe(postcss(plugins))
        .pipe(gulp.dest(dist + "/assets/css"))
        .pipe(browsersync.stream());
});

gulp.task("js-task", () => {
    return gulp
        .src("./src/js/main.js")
        .pipe(plumber())
        .pipe(
            webpack({
                mode: "development",
                output: {
                    filename: "script.js",
                },
                watch: false,
                devtool: "source-map",
                module: {
                    rules: [
                        {
                            test: /\.m?js$/,
                            exclude: /(node_modules|bower_components)/,
                            use: {
                                loader: "babel-loader",
                                options: {
                                    presets: [
                                        [
                                            "@babel/preset-env",
                                            {
                                                debug: true,
                                                corejs: 3,
                                                useBuiltIns: "usage",
                                            },
                                        ],
                                    ],
                                },
                            },
                        },
                    ],
                },
            })
        )
        .pipe(gulp.dest(dist + "/js"))
        .on("end", browsersync.reload);
});

gulp.task("copy-assets", () => {
    return gulp
        .src("./src/assets/*.*")
        .pipe(plumber())
        .pipe(gulp.dest(dist + "/assets"))
        .on("end", browsersync.reload);
});

gulp.task("image-task", () => {
    return gulp
        .src("src/assets/img/**/*.*")
        .pipe(plumber())
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imageminPngquant(),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest(dist + "/assets/img"))
        .on("end", browsersync.reload);
});

gulp.task("fonts-task", () => {
    return gulp
        .src("./src/assets/fonts/**/*.*")
        .pipe(plumber())
        .pipe(imagemin())
        .pipe(gulp.dest(dist + "/assets/fonts"))
        .on("end", browsersync.reload);
});



gulp.task("watch", () => {
    browsersync.init({
        server: "./dist/",
        port: 3000,
        notify: true,
    });

    gulp.watch("./src/index.html", gulp.parallel("html-task"));
    gulp.watch("./src/assets/sass/**/*.scss", gulp.parallel("css-task"));
    gulp.watch("./src/assets/*.*", gulp.parallel("copy-assets"));
    gulp.watch("./src/assets/img/**/*.*", gulp.parallel("image-task"));
    gulp.watch("./src/assets/fonts/**/*.*", gulp.parallel("fonts-task"));
    gulp.watch("./src/js/**/*.js", gulp.parallel("js-task"));
});

function clean() {
    return del(dist);
}

gulp.task(
    "build",
    gulp.series(
        clean,
        gulp.parallel(
            "html-task",
            "css-task",
            "fonts-task",
            "image-task",
            "copy-assets",
            "js-task"
        )
    )
);

gulp.task("build-prod-js", () => {
    return gulp
        .src("./src/js/main.js")
        .pipe(
            webpack({
                mode: "production",
                output: {
                    filename: "script.js",
                },
                module: {
                    rules: [
                        {
                            test: /\.m?js$/,
                            exclude: /(node_modules|bower_components)/,
                            use: {
                                loader: "babel-loader",
                                options: {
                                    presets: [
                                        [
                                            "@babel/preset-env",
                                            {
                                                corejs: 3,
                                                useBuiltIns: "usage",
                                            },
                                        ],
                                    ],
                                },
                            },
                        },
                    ],
                },
            })
        )
        .pipe(gulp.dest(dist));
});

gulp.task("default", gulp.parallel("watch", "build"));
