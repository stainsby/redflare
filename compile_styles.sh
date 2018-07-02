#!/bin/bash
SRC_DIR='./less'
DEST_DIR='./static/css'
# for INFILE in "$SRC_DIR"/*.less; do
#   echo "Compiling $INFILE."
#   PREFIX=${INFILE%.less}
#   lessc "$INFILE" "$DEST_DIR/${PREFIX##*/}".less
# done
lessc "$SRC_DIR"/main.less "$DEST_DIR"/main.css
