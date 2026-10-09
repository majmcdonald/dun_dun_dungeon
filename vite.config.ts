import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { defineConfig } from 'vite';

// The commit the game was built from, for the run logs. Uncommitted changes add a short hash of the diff,
// so different local edits on the same commit tell apart.
function buildId(): string {
  try {
    const sha = execSync('git rev-parse --short HEAD').toString().trim();
    const diff = execSync('git diff HEAD').toString();
    return diff ? `${sha}+${createHash('sha1').update(diff).digest('hex').slice(0, 7)}` : sha;
  } catch {
    return 'unknown';
  }
}

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(buildId()) },
});
