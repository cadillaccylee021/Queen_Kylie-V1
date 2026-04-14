const fs = require('fs');
// Load whichever env file exists — supports both .env and config.env
if (fs.existsSync('.env'))        require('dotenv').config({ path: './.env' });
else if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

module.exports = {
    SESSION_ID:        process.env.SESSION_ID    || '',          // Set via env — no hardcoded default
    ALIVE_IMG:         process.env.ALIVE_IMG     || 'https://files.catbox.moe/3q57x5.jpg',
    ALIVE_MSG:         process.env.ALIVE_MSG     || "Hey there, I'm alive",
    ANTI_DEL_PATH:     process.env.ANTI_DEL_PATH || 'same',
    OWNER_NUMBER:      process.env.OWNER_NUMBER  || '',          // Set via env
    MODE:              process.env.MODE           || 'public',
    VERSION:           process.env.VERSION        || '3.0.1',
    STICKER_NAME: process.env.STICKER_NAME || "ҟìղց օƒ էհҽ հìցհաąվ",

PACK_NAME: process.env.PACK_NAME || "ҟìղց օƒ էհҽ հìցհաąվ",
    PREFIX:            process.env.PREFIX         || ':',
    BOT_NAME:          process.env.BOT_NAME       || '*QUEEN-KYLIE-V1*',
    AUTO_READ_STATUS:  process.env.AUTO_READ_STATUS || 'false',
    OWNER_NAME:        process.env.OWNER_NAME     || 'Owner',
};
