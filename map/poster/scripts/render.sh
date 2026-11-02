#!/bin/zsh
# Render an SVG to PNG with headless Chrome (uses macOS system fonts). usage: render.sh in.svg out.png width height
IN=$1 OUT=$2 W=$3 H=$4
TMP=$(mktemp -d /private/tmp/claude-501/render.XXXX)
cat > $TMP/page.html <<HTML
<!doctype html><html><head><style>html,body{margin:0;background:#efe6d4}img{display:block;width:${W}px;height:${H}px}</style></head>
<body><object data="file://$IN" type="image/svg+xml" style="display:block;width:${W}px;height:${H}px"></object></body></html>
HTML
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --user-data-dir=$TMP/profile --window-size=$W,$H --virtual-time-budget=4000 --screenshot=$OUT file://$TMP/page.html >/dev/null 2>&1
rm -rf $TMP
