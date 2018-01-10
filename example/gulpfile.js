
var gulp = require('gulp'),
    minifycss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant');

/* 默认任务 */
gulp.task('default', ['minify-js','minify-css']);

/* 压缩js任务 */
gulp.task('minify-js', function () {
    gulp.src("public/javascripts/*.js").
    pipe(uglify()).
    pipe(gulp.dest('./public/dist/javascripts'));
});

/* 压缩css任务 */
gulp.task('minify-css', function () {
    gulp.src("public/stylesheets/css/*.css").
    pipe(minifycss()).
    pipe(gulp.dest('./public/dist/stylesheets'));
});

/* JS检查 */
gulp.task('jshint', function () {
    gulp.src("public/javascripts/*.js")
        .pipe(jshint())
        .pipe(jshint.reporter());

});

/* 压缩图片 */
gulp.task('imagemin', function () {
    gulp.src("public/images/*.*").
    pipe(imagemin({
        progressive : true,
        use : [pngquant()]
    })).
    pipe(gulp.dest('./public/dist/images'));
});
