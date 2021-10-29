const project_folder = require('path').basename(__dirname);
const source_folder = "src";


const fs = require('fs');

const path = {
    build:{
        html : project_folder + "/",
        css : project_folder + "/css/",
        img : project_folder + "/img/",
        js : project_folder + "/js/",
        fonts : project_folder + "/fonts/",
    },
    src:{
        html : [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
        css : source_folder + "/scss/style.scss",
        img : source_folder + "/img/**/*.{jpg,png,svg,gif,ico, webp}",
        js : source_folder + "/js/script.js",
        fonts : source_folder + "/fonts/*.ttf",
    },
    watch:{
        html : source_folder + "/**/*.html",
        css : source_folder + "/scss/**/*.scss",
        img : source_folder + "/img/**/*.{jpg,png,svg,gif,ico, webp}",
        js : source_folder + "/js/**/*.js",
    },
    clean:"./" + project_folder + "/"
}

const {src, dest} = require('gulp'),
    gulp = require('gulp'),
    browsersync = require("browser-sync").create(),
    fileindlude = require("gulp-file-include"),
    del = require('del'),
    scss = require('gulp-sass')(require('sass'));
    autoprefixer = require('gulp-autoprefixer'),
    groupCssMediaQueries = require('gulp-group-css-media-queries'),
    cleanCss = require('gulp-clean-css'),
    rename = require('gulp-rename'),
/*
    место для babel
*/
    uglify = require('gulp-uglify-es').default,
    imgMin = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webphtml = require('gulp-webp-html'),
    webpcss = require('gulp-webpcss'),
    svgSprite = require("gulp-svg-sprite"),
    ttf2woff2 = require("gulp-ttf2woff2"),
    ttf2woff = require("gulp-ttf2woff"),
    fonter = require("gulp-fonter")



function browserSync(){
    browsersync.init({
        server:{
            baseDir: "./" + project_folder + "/",
        },
    port: 3000,
    notyfy:false,
    })
}

function html(){
    return src(path.src.html)
        .pipe(fileindlude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function css(){
    return src(path.src.css)
//      .pipe(webpcss({webpClass: '.webp',noWebpClass: '.no-webp'}))
        .pipe(
            scss({ outputStyle: 'expanded' }).on('error', scss.logError)
        )
        .pipe(
           groupCssMediaQueries()
        )
        .pipe(autoprefixer({
            overrideBrowserslist: ["last 5 versions"],
            cascade: true,
        }))
        .pipe(dest(path.build.css))
        .pipe(cleanCss())
        .pipe(
            rename({
                extname:".min.css"
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js(){
    return src(path.src.js)
        .pipe(fileindlude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname:".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function img(){
    return src(path.src.img)
        .pipe(
            webp({
                quality:70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(imgMin({
            progressive:true,
            svgoPlugins:[{removeViewBox: false}],
            interlaced: true,
            optimizationLevel: 3
        }))
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

function fonst(){
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

function fontsStyle() {
let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', ()=>{});
        return fs.readdir(path.build.fonts, (err, items) => {
            if(err){
                console.log(err);
            }
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}
function cb() { }


function watchfiles(){
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], img);
}

function clean(){
    return del(path.clean);
}

gulp.task('svgSprite', ()=>{
    return gulp.src([source_folder + '/iconsprite/*.svg'])
    .pipe(
        svgSprite({
            mode:{
                stack:{
                    sprite: "../icons/icons.svg"
                }
            }
        })
    )
    .pipe(dest(path.build.img))
})
gulp.task('otf2ttf', ()=>{
    return gulp.src([source_folder + '/fonts/*.otf'])
    .pipe(fonter({
        formats:['ttf']
    }))
    .pipe(dest(source_folder + '/fonts/'))
})

let build = gulp.series(clean, gulp.parallel(js, css, html, img, fonst), fontsStyle);
let watch = gulp.parallel(build, watchfiles, browserSync);

exports.html = html;
exports.fontsStyle = fontsStyle;
exports.css = css;
exports.fonst = fonst;
exports.js = js;
exports.img = img;
exports.build = build;
exports.watch = watch;
exports.default = watch;