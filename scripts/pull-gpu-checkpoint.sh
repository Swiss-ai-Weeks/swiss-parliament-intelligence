#!/usr/bin/env bash
# Pulls a receipt-only checkpoint from the GPU handoff, verifies its SHA-256, imports it, restages and
# republishes machine alignments, and rebuilds the processing ledger. Read-only on the GPU worker.
# Usage: scripts/pull-gpu-checkpoint.sh [handoff-dir]   (needs data/pilot-launchpad-key + known hosts)
set -euo pipefail
cd "$(dirname "$0")/.."
HANDOFF="${1:-/home/nvidia/swiss-parliament-intelligence/handoffs/cleisthenes-20260922-131027}"
NAME="receipts-$(date +%Y%m%d-%H%M%S).tar.gz"
KEY=data/pilot-launchpad-key; HOSTS=data/launchpad-known-hosts; PORT="${LAUNCHPAD_PORT:-12516}"; TARGET=nvidia@global.prd.ga.launchpad.nvidia.com
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o UserKnownHostsFile="$HOSTS" -p "$PORT" "$TARGET")
REMOTE=$("${SSH[@]}" "set -e; mkdir -p ~/checkpoints; cd '$HANDOFF/session-output'; ls | grep -E '^[0-9]+-canary\.json$' > /tmp/ck.list; tar -czf ~/checkpoints/$NAME -T /tmp/ck.list; wc -l < /tmp/ck.list; sha256sum ~/checkpoints/$NAME | cut -d' ' -f1")
REMOTE_SHA=$(echo "$REMOTE" | tail -1); echo "remote receipts: $(echo "$REMOTE" | head -1)"
mkdir -p data/gpu-processing/checkpoints
scp -q -i "$KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o UserKnownHostsFile="$HOSTS" -P "$PORT" "$TARGET:checkpoints/$NAME" "data/gpu-processing/checkpoints/$NAME"
LOCAL_SHA=$(sha256sum "data/gpu-processing/checkpoints/$NAME" | cut -d' ' -f1)
[ "$REMOTE_SHA" = "$LOCAL_SHA" ] || { echo "SHA_MISMATCH $REMOTE_SHA $LOCAL_SHA"; exit 1; }
if tar -tzf "data/gpu-processing/checkpoints/$NAME" | grep -vqE '^[0-9]+-canary\.json$'; then echo UNEXPECTED_FILES; exit 1; fi
DIR="data/gpu-processing/checkpoints/${NAME%.tar.gz}"; mkdir -p "$DIR"; tar -xzf "data/gpu-processing/checkpoints/$NAME" -C "$DIR"
echo "sha256 $LOCAL_SHA"
node scripts/import-public-processing.mjs "$DIR" | tail -c 400; echo
node scripts/stage-public-alignments.mjs | tail -1
node scripts/publish-machine-alignments.mjs
node scripts/reconcile-processing-backlog.mjs 2>&1 | grep -E '"(pendingAsr|jobs|asrComplete|alignmentCandidates)"|Set aside'
