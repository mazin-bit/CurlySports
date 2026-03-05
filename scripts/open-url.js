#!/usr/bin/env node
/**
 * Opens the dev server URL in the default browser using the system `open` command.
 * Used when Create React App's default browser opening doesn't work (e.g. in Cursor's terminal).
 */
const { execSync } = require('child_process');
const url = process.argv[2];
if (url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : `open "${url}"`;
  execSync(cmd, { stdio: 'inherit' });
}
