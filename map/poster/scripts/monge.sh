#!/bin/zsh
# Run the Monge surface CLI against a session folder.
# MONGE_DIR: Monge checkout with apps/surface; MONGE_ENV: env file holding OPENAI_API_KEY; MONGE_SESSION: task folder.
M=${MONGE_DIR:-$HOME/Documents/Monge-desk}
export MONGE_IMAGE_MODEL=${MONGE_IMAGE_MODEL:-gpt-image-2}
cd $M && exec node --env-file=${MONGE_ENV:-$HOME/Documents/Monge/.env.local} --import tsx $M/apps/surface/cli.ts --session ${MONGE_SESSION:-$HOME/Desktop/chunderdome-map/session} "$@"
