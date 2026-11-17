#!/bin/bash
# Assemble the Yuerta Stock Agent demo video from screenshots.
# Usage: ./assemble.sh [shots-dir] [output]
# Shots (1280x720 PNGs, real renders of the live dApp — never mocked):
#   01-title.png 02-market.png 03-faucet.png 04-buy.png 05-agent.png
#   06-vault.png 07-leaderboard.png 08-basescan.png 09-outro.png
# Missing shots become a labeled placeholder card (never silently skipped).
# Output: video/demo.mp4 (<=3 min). Requires ffmpeg + DejaVu fonts.
set -euo pipefail
DIR="${1:-video/shots}"
OUT="${2:-video/demo.mp4}"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# seconds per shot (title/outro shorter; total 160s = 2:40, under the 3-min cap)
declare -A DUR=( [01]=5 [02]=25 [03]=20 [04]=20 [05]=25 [06]=20 [07]=20 [08]=20 [09]=5 )
declare -A CAP=(
  [01]="Yuerta Stock Agent|AI trading tokenized stocks on Base Sepolia - free to play, testnet only"
  [02]="Live market - 8 stocks, oracle prices updated every 4 hours"
  [03]="Faucet - claim 10,000 test USDC a day, free"
  [04]="One-click buy - settles on-chain"
  [05]="Agent feed - every trade + reasoning published on-chain"
  [06]="Copy-trading vault - NAV on-chain (TVL \$0 so far - shown honestly)"
  [07]="Weekly league - humans vs agent, winner badges on-chain"
  [08]="Proof - 18 trades, \$18,000 volume on Sepolia Basescan"
  [09]="Yuerta Stock Agent - Base Stocks Maxxing Builder Quest - @buildonbase"
)

mkcard() { # $1=out.png $2=title $3=sub
  ffmpeg -y -v error -f lavfi -i "color=c=0x0b1220:s=1280x720:d=5" -vf \
    "drawtext=fontfile=$FONT:text='$2':fontsize=54:fontcolor=white:x=(w-text_w)/2:y=300,drawtext=fontfile=$FONT_R:text='$3':fontsize=26:fontcolor=0x9fb3d1:x=(w-text_w)/2:y=380" \
    -frames:v 1 "$1"
}
mkshot() { # $1=png $2=seconds $3=caption -> $4=mp4 segment
  ffmpeg -y -v error -loop 1 -i "$1" -vf \
    "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,drawtext=fontfile=$FONT_R:text='$3':fontsize=22:fontcolor=white:box=1:boxcolor=0x00000099:boxborderw=12:x=24:y=h-56" \
    -t "$2" -r 30 -c:v libx264 -pix_fmt yuv420p "$4"
}

SEGMENTS=()
for n in 01 02 03 04 05 06 07 08 09; do
  src="$DIR/$n-*.png"
  img=$(ls $src 2>/dev/null | head -1 || true)
  if [ -z "$img" ]; then
    title="${CAP[$n]%%|*}"; sub="${CAP[$n]#*|}"
    img="$TMP/$n-placeholder.png"
    mkcard "$img" "SHOT $n MISSING - $title" "$sub"
  fi
  cap="${CAP[$n]#*|}"
  mkshot "$img" "${DUR[$n]}" "$cap" "$TMP/seg-$n.mp4"
  SEGMENTS+=("file '$TMP/seg-$n.mp4'")
done
printf "%s\n" "${SEGMENTS[@]}" > "$TMP/list.txt"
ffmpeg -y -v error -f concat -safe 0 -i "$TMP/list.txt" -c copy "$OUT"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
echo "OK: $OUT"
