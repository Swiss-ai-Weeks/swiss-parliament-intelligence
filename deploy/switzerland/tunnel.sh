#!/bin/sh
set -eu
umask 077
if [ ! -f /keys/id_ed25519 ]; then ssh-keygen -q -t ed25519 -N '' -C swiss-pilot-production -f /keys/id_ed25519; fi
printf 'SWISS_TUNNEL_PUBLIC_KEY '
cat /keys/id_ed25519.pub
printf '%s\n' "$NVIDIA_KNOWN_HOSTS" > /tmp/known_hosts
exec ssh -N -i /keys/id_ed25519 -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=/tmp/known_hosts -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -L 0.0.0.0:4319:127.0.0.1:30081 -L 0.0.0.0:4320:127.0.0.1:30082 -L 0.0.0.0:4321:127.0.0.1:8017 -p 12516 swiss-model@global.prd.ga.launchpad.nvidia.com
