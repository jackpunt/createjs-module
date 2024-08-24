import cp from 'child_process';
import fs from 'fs';
import gulp from 'gulp';
import concat from 'gulp-concat';
import insert from 'gulp-insert';
import gutil from 'gulp-util';
import replace from 'gulp-replace';

const VERSIONS = {
    EASEL: '1.0.4',
    CREATE: '1.3.0'
};

const SRC = {
    EASEL: `../EaselJS/lib/easeljs.js`
};

const DEST = {
    CREATE: './'
};
const TRNL = "tr -d '\r' < easeljs-raw.js > easeljs.js";
function execTrnlTask() {
    return cp.exec(TRNL, (error, stdout, stderr) => { })
}

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
        .pipe(concat('easeljs-raw.js'))
        // Fix some things and convert to module format
        .pipe(replace(/(this.createjs =)/g, '\/\/ $1')) // or just delete them
        .pipe(replace(/(var ww =)/g, '\/\/ $1'))         // or just delete them
        .pipe(insert.prepend('// var createjs = (this.createjs = (this.createjs || {}));\nvar createjs = {};\nvar ww; try { ww = window} catch { ww = false }\n'))
        // unwrap the (function() { ... })()}, keeping the ...
        .pipe(replace(/\n(\(function ?\(\) ?\{)/g,'\n// $1'))
        // sic! From (August 23rd, 2012 2:02 PM) e640d39 "Change to namespace implementation."
        .pipe(replace('}());', '// }());'))
        // DisplayProps.js came later, and got it right:
        .pipe(replace('Props;\n})()', 'Props;\n//})()'))
        // module is always strict:
        .pipe(replace('\n\t"use strict";','\n//\t"use strict";'))
        // export all the classname functions:
        .pipe(replace(/\n\tfunction ([A-Z])/g, '\nexport function $1'))
        // Bookkeepig timestamp
        .pipe(insert.append(`\n/* Easel Compiled: ${new Date()} */`))
        // The actual "module" definition: credit to albary3 
        .pipe(insert.append('\nif(typeof module !== "undefined" && typeof module.exports !== "undefined") module.exports = this.createjs;\n'))
        .pipe(gulp.dest(DEST.CREATE));
}


function doPackage() {
    let pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    pkg.version = VERSIONS.CREATE;
    return string_src('package.json', JSON.stringify(pkg, null, 4))
    .pipe(gulp.dest(DEST.CREATE));
}

gulp.task('compile', gulp.series(compile, execTrnlTask));
gulp.task('package', gulp.series(doPackage));
gulp.task('default', gulp.series(compile, doPackage));
