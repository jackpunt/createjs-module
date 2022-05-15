import fs from 'fs';
import gulp from 'gulp';
import concat from 'gulp-concat';
import insert from 'gulp-insert';
import gutil from 'gulp-util';

const VERSIONS = {
    EASEL: '1.0.0'
};

const SRC = {
    EASEL: `./node_modules/easeljs/lib/easeljs.js`
};

const DEST = {
    CREATE: './'
};

function string_src(filename, string) {
    var src = require('stream').Readable({ objectMode: true });
    src._read = function () {
        this.push(new gutil.File({ cwd: '', base: '', path: filename, contents: Buffer.from(string) }));
        this.push(null)
    };
    return src
}
function compile() {
    return gulp.src([
        SRC.EASEL
    ])
        .pipe(concat('easeljs.js'))
        .pipe(insert.prepend('var createjs = (this.createjs = (this.createjs || {}));\n'))
        .pipe(insert.append(`\n/* Easel Compiled: ${new Date()} */`))
        .pipe(insert.append('\nif(typeof module !== "undefined" && typeof module.exports !== "undefined") module.exports = this.createjs;\n'))
        .pipe(gulp.dest(DEST.CREATE));
}


function doPackage() {
    let pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    pkg.version = VERSIONS.CREATE;
    return string_src('package.json', JSON.stringify(pkg, null, 4))
    .pipe(gulp.dest(DEST.CREATE));
}

gulp.task('compile', gulp.series(compile));
gulp.task('package', gulp.series(doPackage));
gulp.task('default', gulp.series(compile, doPackage));
