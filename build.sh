npm run build
rm bin/mines-over.zip
cd dist
zip -r ../bin/mines-over.zip .
cd ..
echo --- FINISHED OUTPUT IN bin/---
