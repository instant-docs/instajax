import esbuild from 'esbuild';

async function build() {
    // minify 3rd party libraries
    await esbuild.build({
        entryPoints: ['node_modules/idiomorph/dist/idiomorph.esm.js'],
        outdir: 'lib',
        format: 'esm',
        target: ['es6'],
        bundle: true,
        minify: true,
        sourcemap: false,
        banner: {
            js: `/*!
BSD 2-Clause License
Copyright (c) 2022, Big Sky Software
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
*/`,
        },
        logLevel: 'warning',
    });

    await esbuild.build({
        entryPoints: ['./index.js'],
        outfile: './dist/min.js',
        bundle: true,
        minify: true,
        format: 'esm',
        target: ['es6'],
        sourcemap: false,
        logLevel: 'warning',
    });
}

build();
