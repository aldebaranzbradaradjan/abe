#!/bin/bash
cd ame-src
wasm-pack build --target web --out-name wasm --out-dir ../public/ame --release
cd ..
npm run build
