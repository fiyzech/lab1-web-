const { src, dest, series, parallel, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cssnano = require('gulp-cssnano');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const browserSync = require('browser-sync').create();

const paths = {
  html: { src: 'app/**/*.html', dest: 'dist' },
  scss: { src: 'app/style.scss', watch: 'app/**/*.scss', dest: 'dist/css' }, // <-- тут
  js:   { src: 'app/script.js',  watch: 'app/**/*.js',   dest: 'dist/js' },  // <-- і тут
  img:  { src: 'app/img/**/*.{png,jpg,jpeg,svg,gif,webp}', dest: 'dist/imgs' }
};

function htmlTask() {
  return src(paths.html.src).pipe(dest(paths.html.dest)).pipe(browserSync.stream());
}

function scssTask() {
  return src(paths.scss.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(cssnano())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(paths.scss.dest))
    .pipe(browserSync.stream());
}

function jsTask() {
  return src(paths.js.src, { sourcemaps: true })
    .pipe(concat('bundle.min.js'))
    .pipe(uglify())
    .pipe(dest(paths.js.dest, { sourcemaps: '.' }))
    .pipe(browserSync.stream());
}

let _imagemin;
async function imgTask() {
  if (!_imagemin) {
    const m = await import('gulp-imagemin');
    _imagemin = m.default || m;
  }
  return src(paths.img.src).pipe(_imagemin()).pipe(dest(paths.img.dest));
}

function reload(done) { browserSync.reload(); done(); }

function serve() {
  browserSync.init({ server: { baseDir: 'dist' }, open: false, notify: false });
  watch(paths.html.src, htmlTask);
  watch(paths.scss.watch, scssTask);
  watch(paths.js.watch, jsTask);
  watch(paths.img.src, series(imgTask, reload));
}

const build = series(parallel(htmlTask, scssTask, jsTask, imgTask));
exports.build = build;
exports.default = series(build, serve);
