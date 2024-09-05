if [ -d build ]; then
    rm -r build;
fi
mkdir build
mkdir build/scripts
mkdir build/public

tsc --build

# build site
cp -r src/assets build/public/assets
node --enable-source-maps build/scripts/build.js src/content -o build/public/content -v
