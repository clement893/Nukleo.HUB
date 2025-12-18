#!/bin/bash
set -e

# Synchroniser la base de données en arrière-plan (ne bloque pas le démarrage)
(prisma db push --accept-data-loss --skip-generate || echo "Warning: Database sync failed, continuing anyway...") &

# Démarrer l'application immédiatement
exec node .next/standalone/server.js

