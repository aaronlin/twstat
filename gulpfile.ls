require! <[gulp gulp-livescript gulp-stylus gulp-jade]>

gulp.task 'livescript' ->
  gulp.src './*.ls'
    .pipe gulp-livescript!
    .pipe gulp.dest './'

gulp.task 'css' ->
  gulp.src './*.styl'
    .pipe gulp-stylus use: [require('nib')!]
    .pipe gulp.dest './dist'

gulp.task 'jade' ->
  gulp.src './*.jade'
    .pipe gulp-jade!
    .pipe gulp.dest './'

gulp.task 'build' <[css livescript jade]>

gulp.task 'watch' ->
  gulp.watch '*.jade' <[jade]>
  gulp.watch '*.ls' <[livescript]>
