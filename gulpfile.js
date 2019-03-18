// plugins

var gulp = require("gulp");
// var less = require("gulp-less");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var autoprefixer = require("gulp-autoprefixer");
var cleanCSS = require("gulp-clean-css");
var imagemin = require("gulp-imagemin");
var svgstore = require("gulp-svgstore");

var cheerio = require('gulp-cheerio');

var rename = require("gulp-rename");
var browserSync = require("browser-sync").create();
var del = require("del");
var sourcemaps = require("gulp-sourcemaps");
var uglify = require("gulp-uglify");
var flatten = require("gulp-flatten");
var filter = require("gulp-filter");
var gcmq = require("gulp-group-css-media-queries");
var imageminMozjpeg = require('imagemin-mozjpeg');

// functions--dev
function clean() {
  return del(["build/*"]);
}

function copy() {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/lib/**"
  ], { base: "source" })
  .pipe(gulp.dest("build"));
}

function style() {
  return gulp.src("source/style/style.*")
    .pipe(plumber())
    .pipe(sourcemaps.init())
    // .pipe(less())
    .pipe(sass())
    .pipe(autoprefixer({ browsers: [">0.1%"], cascade: false }))
    .pipe(gcmq())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest("build/css"))
    .pipe(filter('**/style.css'))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(rename({suffix: '.min'}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest("build/css"))
    .pipe(browserSync.stream());
}

function html() {
    return gulp.src("source/*.html")
        .pipe(posthtml([ include() ]))
        .pipe(gulp.dest("build"))
}

function script() {
  return gulp.src("source/js/*.js")
    .pipe(uglify({ toplevel: true }))
    .pipe(gulp.dest("build/js"))
    .pipe(browserSync.stream());
}

function images() {
  return gulp.src([
      "source/blocks/**/img/*.{png,jpg,jpeg,svg}",
      "!source/blocks/**/img/*-icon.svg"
    ])
    .pipe(flatten())
    .pipe(imagemin([
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.jpegtran({ progressive: true }),
      imageminMozjpeg({ quality: 75 }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
}

function sprite() {
  return gulp.src("source/blocks/**/img/*-icon.svg")
    
    .pipe(cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
      },
      parserOptions: { xmlMode: true }
    }))
    
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
}

function browserSyncReload(done) {
    browserSync.reload();
    done();
}

function watch() {
    browserSync.init({
        server: { baseDir: "build/" },
        port: 3000
    });

    // gulp.watch(["source/style/**/*.less", "source/blocks/**/*.less"], style);
    gulp.watch(["source/style/**/*.scss", "source/blocks/**/*.scss"], style);
    gulp.watch("source/js/*.js", script);
    gulp.watch("source/*.html", gulp.series(html, browserSyncReload));
}

// functions--pub

function cleanghub() {
  return del([
    "/home/constantine/Документы/GitHub/costaline.github.io/projects/waxom/*"
  ], { force: true });
}

function copyghub() {
  return gulp.src("build/**")
    .pipe(gulp.dest("/home/constantine/Документы/GitHub/costaline.github.io/projects/waxom"));
}

// complex tasks

// var build = gulp.series(clean, copy, gulp.parallel(style, html, script, images));
var build = gulp.series(clean, copy, sprite, gulp.parallel(style, html, script, images));
var dev = gulp.series(build, watch);
var publish = gulp.series(build, cleanghub, copyghub);

// export tasks

exports.clean = clean;
exports.style = style;
exports.sprite = sprite;
exports.html = html;
exports.script = script;
exports.images = images;
exports.copy = copy;
exports.watch = watch;

exports.cleanghub = cleanghub;
exports.copyghub = copyghub;

exports.default = build;
exports.build = build;
exports.dev = dev;

exports.publish = publish;
