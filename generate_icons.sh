#!/bin/bash

rm -rf tmp
mkdir -p tmp

for path in icons/privilege
do
  cp $path/*.svg tmp
  mkdir -p static/$path
  for file in tmp/*.svg
  do
    echo "converting $file"
    sed -i -e 's/fill:#ffffff/fill:#c23400/' $file
    filename=$(basename "$file")
    filestem="${filename%.*}"
    convert -antialias -resize 12x12 -background none $file tmp/$filestem.png
    cp tmp/$filestem.png static/$path
  done
  rm -rf tmp
done

rm -rf tmp
