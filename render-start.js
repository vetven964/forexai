// V-TRADE Render startup wrapper
'use strict';
require('./telegram-auto-formatter-preload.js');
require('./vtrade-runtime-env-lock.js');
// Install the canonical bilingual Telegram renderer before the production launcher.
require('./telegram-language-finalizer.js');
require('./server-launcher.js');
