#!/usr/bin/env node
/**
 * scripts/bump-cache.js
 * Roda como "prebuild" antes de cada deploy no Vercel.
 * Injeta um timestamp no sw.js, forçando o browser a descartar o cache antigo.
 */
const fs   = require('fs');
const path = require('path');

const swPath   = path.join(__dirname, '..', 'public', 'sw.js');
const swSource = fs.readFileSync(swPath, 'utf8');

// Timestamp no formato YYYYMMDD-HHmmss (UTC)
const now = new Date();
const ts  = now.toISOString().replace(/[-:T]/g, '').slice(0, 15);
//   ex: "20260311-143022"  →  liturgia-shell-20260311-143022

const updated = swSource.replace(/BUILD_TIMESTAMP/g, ts);
fs.writeFileSync(swPath, updated, 'utf8');

console.log(`✅  sw.js atualizado — cache: liturgia-shell-${ts}`);
