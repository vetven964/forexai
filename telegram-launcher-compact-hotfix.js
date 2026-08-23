'use strict';
// Safe boot hotfix: do not rewrite server-launcher.js at runtime.
// The previous V2 formatter rewrote the launcher and could leave Render
// with a generated syntax error. Keep this module intentionally side-effect free.
console.log('[V-TRADE TELEGRAM] launcher compact hotfix disabled safely; using production launcher formatter');
