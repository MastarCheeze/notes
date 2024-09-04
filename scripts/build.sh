if [ -d build ]; then
    rm -r build;
fi
mkdir build
mkdir build/scripts
mkdir build/public

tsc --build

node --enable-source-maps build/scripts/build.js -v
