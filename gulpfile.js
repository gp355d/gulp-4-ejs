const gulp = require('gulp');
const $ = require('gulp-load-plugins')();//自動引入套件名稱為gulp開頭的套件
const autoprefixer = require('autoprefixer');//引入autoprefixer套件
// var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');
var envOptions = {
  string:'env',
  default:{env: 'develop'}
}
var options = minimist(process.argv.slice(2),envOptions);
  console.log(options);
  
gulp.task('clean', function () {
  return gulp.src(['./.tmp','./public'],{read: false, allowEmpty: true})
    .pipe($.clean());
});

gulp.task('ejs', function() {
  return  gulp.src(['./source/**/*.html','/source/**/*.ejs'])//原始檔案來源位置，**/*寫法，會針對所有子資料夾做編譯
    .pipe($.plumber())
    .pipe($.frontMatter())
    .pipe(
        $.layout((file) => {
      return file.frontMatter;
      })
    )
    .pipe(gulp.dest('./public/'))//指定的輸出資料夾位置
    .pipe(browserSync.stream());
});

gulp.task('sass', function () {
  return gulp.src('./source/scss/**/*.scss')//原始檔案來源位置
    .pipe($.plumber())//避免有錯誤造成運作停止
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      outputStyle: 'nested',
      includePaths: ['./node_modules/bootstrap/scss']
    }))
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss([autoprefixer()])) // 直接引入 autoprefixer
    .pipe($.if(options.env === 'production', $.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))//指定的輸出資料夾位置
    .pipe(browserSync.stream());//自動重新整理
});

gulp.task('babel',() => {
  return gulp.src('./source/js/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env']
    }))
    .pipe($.concat('all.js'))//合併
    .pipe($.if(options.env === 'production',$.uglify(
      {
        compress:{
          drop_console:true
        }
      }
    )))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream());
});
// gulp.task('bower', function() {
//   return gulp.src(mainBowerFiles())
//     .pipe(gulp.dest('./.tmp/vendors'))
//     .pipe($.concat('vendors.js'))
//     .pipe($.uglify())
//     .pipe(gulp.dest('./public/js'));
// });

gulp.task('vendorJs', function() {
  return gulp.src([
    // './.tmp/vendors/**/*.js', 
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
  ])
  .pipe($.concat('vendors.js'))
  .pipe($.if(options.env === 'production', $.uglify()))
  .pipe(gulp.dest('./public/js'));
})

gulp.task('browser-sync', function() {
  });

gulp.task('image-min', () => {
  return gulp.src('./source/images/*')
    .pipe($.if(options.env === 'production',$.imagemin()))
    .pipe(gulp.dest('./public/images'));
});

gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});
gulp.task('watch', function () { //會監控指定的任務名稱
});

gulp.task('build', gulp.series('clean','vendorJs',
  gulp.parallel('ejs','sass','babel','image-min')
));

gulp.task('default', gulp.series('clean','vendorJs',
  gulp.parallel('ejs','sass','babel','image-min'),
    function(done){
      browserSync.init({
        server: {
            baseDir: "./public"
        },
        reloadDebounce: 2000
    });
  gulp.watch(['./source/scss/**/*.scss'], gulp.series('sass'));//監控是否有變動，有就會執行指定的任務名稱(例如'sass','jade')
  gulp.watch(['./source/**/*.ejs'], gulp.series('ejs'));
  gulp.watch(['./source/**/*.html'], gulp.series('ejs'));
  gulp.watch(['./source/js/**/*.js'], gulp.series('babel'));
  done()
  }
));