import esbuild from 'esbuild';

esbuild.build({
    entryPoints: ['./index.js'],
    outfile: './dist/min.js',
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es6'],
    sourcemap: false,
    logLevel: 'warning',
    banner: {
        js: `/*!
 * instajax v1.7.1
 * Author: Ufuk Bakan (println.ufukbakan@gmail.com)
 * Licensed under AGPL-3.0-only
 * See https://www.gnu.org/licenses/agpl-3.0.html for more information.
 */`
    }
});