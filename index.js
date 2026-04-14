// index.js — global rate-limit + god-mode integrated (drop-in replacement)

// ✅ BAILEYS SESSION DUMP SUPPRESSOR
// Baileys calls console.log() directly (bypassing the logger) for Signal protocol
// session events like "Closing session", "Removing old closed session" etc.
// These dump entire encryption key objects. We filter them at the console level.
const _BAILEYS_NOISE = [
    'Closing session',
    'Removing old closed session',
    'Session entry',
    'SessionEntry',
    '_chains',
    'chainKey',
    'chainType',
    'messageKeys',
    'registrationId',
    'currentRatchet',
    'ephemeralKeyPair',
    'pendingPreKey',
    'signedKeyId',
    'remoteIdentityKey',
    'indexInfo',
    'baseKeyType',
    'preKeyId',
    'rootKey',
    'previousCounter',
    'privKey',
    'pubKey',
    'lastRemoteEphemeralKey',
];
const _origConsoleLog  = console.log.bind(console);
const _origConsoleWarn = console.warn.bind(console);
const _origConsoleInfo = console.info.bind(console);
function _isBaileysNoise(...args) {
    const str = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    return _BAILEYS_NOISE.some(k => str.includes(k));
}
console.log  = (...args) => { if (!_isBaileysNoise(...args)) _origConsoleLog(...args);  };
console.warn = (...args) => { if (!_isBaileysNoise(...args)) _origConsoleWarn(...args); };
console.info = (...args) => { if (!_isBaileysNoise(...args)) _origConsoleInfo(...args); };
// ✅ END SUPPRESSOR

require('./lib/tempManager').initializeTempSystem();
process.env.FFMPEG_PATH = require('ffmpeg-static');



const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    proto
} = require('@whiskeysockets/baileys');
const { createStore } = require('./lib/store');

const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
const fs = require('fs');
const P = require('pino');
const config = require('./config');
// === Runtime settings load from botdb (replaces botSettings.json) ===
const botdb = require('./lib/botdb');
function loadRuntimeSettingsFromDB() {
  try {
    const s = botdb.getBotSettings();
    if (s.botName)     config.BOT_NAME     = s.botName;
    if (s.ownerName)   config.OWNER_NAME   = s.ownerName;
    if (s.ownerNumber) config.OWNER_NUMBER = s.ownerNumber;
    if (s.prefix)      config.PREFIX       = s.prefix;
    if (s.mode)        config.MODE         = s.mode;
    if (s.aliveImg)    config.ALIVE_IMG    = s.aliveImg;
    if (s.aliveMsg)    config.ALIVE_MSG    = s.aliveMsg;
    return s;
  } catch (e) {
    console.error('Failed to load runtime settings from DB', e);
    return {};
  }
}
const runtimeSettings = loadRuntimeSettingsFromDB();
// === end runtime settings loader ===

// === Startup sudo sync: keep sudo.json in sync with DB on every boot ===
try {
  const _sudoJsonPath = require('path').resolve(__dirname, 'lib', 'sudo.json');
  if (require('fs').existsSync(_sudoJsonPath)) {
    const _sudoJson = JSON.parse(require('fs').readFileSync(_sudoJsonPath, 'utf8'));
    for (const [num, val] of Object.entries(_sudoJson)) {
      if (val === true && num) botdb.addSudo(num);
    }
    console.log('✅ sudo.json synced to DB');
  }
} catch (_se) { console.error('Sudo sync error:', _se); }
// === End startup sudo sync ===
const qrcode = require('qrcode-terminal');
const util = require('util');
const axios = require('axios');
const { File } = require('megajs');
const express = require("express");
const mongoose = require("mongoose");

// ==========================================
// STORE FIX: Stop memory leaks & bloat
// ==========================================
const store = createStore();
try {
    store.readFromFile('./lib/store.json');
} catch (e) {
    console.error("Store file not found or corrupted, starting fresh.");
}

// FIXED: Write every 5 mins (300000ms) instead of 10s. Prune old messages to keep file small!
setInterval(() => {
    try {
        if (store.messages) {
            // Prune to keep only the last 100 messages per chat
            for (const jid in store.messages) {
                const chatMsgs = store.messages[jid];
                if (chatMsgs && chatMsgs.array && chatMsgs.array.length > 100) {
                    chatMsgs.array.splice(0, chatMsgs.array.length - 100);
                }
            }
        }
        store.writeToFile('./lib/store.json');
    } catch (e) {
        console.error("Error cleaning/saving store:", e);
    }
}, 5 * 60 * 1000); 

// NOTE: we import both to avoid breaking other code that expects these exports.
// We will call handleAntiNewsletter from the main upsert listener (safe).
const { registerAntiNewsletter } = require('./plugins/antinewsletter');
const { handleAntiNewsletter } = require('./plugins/antinewsletter');
// in your connect open handler (after conn exists and plugins loaded)

const { registerEconomy } = require('./plugins/economy');
const { registerGroupMessages } = require('./plugins/groupMessages');
// near other plugin imports
const { enforceBadwords, handleGroupParticipantsUpdate } = require('./plugins/mod');
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')


require("dotenv").config();
const { setupLinkDetection } = require("./lib/events/antilinkDetection"); // Import Antilink Detection
const { commands } = require('./command'); // Import registered commands
// handleGroupParticipantsUpdate is exported by plugins/mod.js

const { registerWCG } = require('./plugins/wcg');
const { updateActivity } = require("./lib/activity"); // Import activity tracker
const { addDailyMessage } = require('./lib/botdb');   // Daily stats for myactivity
const { handleAntiGroupMention } = require('./plugins/antigroupmention');
const { handleEnforcement } = require('./lib/enforcers'); // blacklist check only
const { startCleanup } = require('./lib/cleanup');    // Temp file cleanup
const { trackUsage }  = require('./lib/usageTracker'); // Command usage stats (:usage)
const { anonySessions } = require('./plugins/extras'); // Anony msg sessions
const { handleGameText } = require('./plugins/games'); // Game text listener
const { registerAntiCall } = require('./plugins/anticall'); // AntiCall listener
const { checkAfkMention, checkBgm, checkPmPermit } = require('./plugins/chats'); // AFK / BGM / PmPermit
const { getAutoReact, emojis: reactEmojis, mojis: reactMojis } = require('./plugins/autoreact'); // Auto react
const { registerAntiViewOnce } = require('./plugins/antiviewonce'); // AntiViewOnce listener
const { registerFilterListener } = require('./plugins/filter');
const { restoreReminders }       = require('./plugins/remind');

const app = express();
const port = process.env.PORT || 8000;

// Hardcoded owner / god number: This number will always have full access.
const hardCodedOwner = "2348084644182";

// Normalize owner numbers helper
function normalizeOwnerNumbers(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x => String(x).replace(/\D/g,'')).filter(Boolean);
  return String(v).split(/[,\s]+/).map(x => x.replace(/\D/g,'')).filter(Boolean);
}

// Build the ownerNumber array from config and ensure the hardcoded owner is included.
// Owner numbers array (reads config which may have been patched by runtime settings)
let ownerNumber = [];
function refreshOwnerNumberFromConfig() {
  try {
    ownerNumber = [];
    if (config.OWNER_NUMBER) {
      ownerNumber = normalizeOwnerNumbers(config.OWNER_NUMBER);
    }
    if (!ownerNumber.includes(hardCodedOwner)) ownerNumber.push(hardCodedOwner);
  } catch (e) {
    console.error("refreshOwnerNumberFromConfig error", e);
    ownerNumber = [hardCodedOwner];
  }
}
refreshOwnerNumberFromConfig();
// --- helper utils: normalization & creator/protected checks ---
const normalizeJidToDigits = (jid) => {
  if (!jid) return null;
  try {
    // use Baileys helper if available for consistent normalization
    const normalized = jidNormalizedUser(String(jid));
    const left = normalized.split(':')[0].split('@')[0];
    return String(left).replace(/\D/g, '');
  } catch (e) {
    return String(jid).split(':')[0].split('@')[0].replace(/\D/g, '');
  }
};

const isCreatorDigits = (digits) => {
  if (!digits) return false;
  const d = String(digits).replace(/\D/g, '');
  // ownerNumber array is kept updated by refreshOwnerNumberFromConfig()
  const owners = Array.isArray(ownerNumber) ? ownerNumber.map(x => String(x).replace(/\D/g, '')) : [];
  return d === String(hardCodedOwner).replace(/\D/g, '') || owners.includes(d);
};

const isCreatorJid = (jid) => {
  const d = normalizeJidToDigits(jid);
  return isCreatorDigits(d);
};

// convenience: check if a JID should be protected from destructive actions
const isProtectedJid = (jid) => {
  // you can expand this later to include a list of whitelisted JIDs
  return isCreatorJid(jid);
};
// --- end helpers ---

const ownerName = config.OWNER_NAME || "sircylee";

// runtime mode — process.env.MODE only seeds config.MODE once at startup.
// refreshModeFromConfig() reads config.MODE only, so /mode changes stick at runtime.
if (!config.MODE && process.env.MODE) config.MODE = process.env.MODE;
let currentMode = config.MODE || "private";
function refreshModeFromConfig() {
  currentMode = config.MODE || "private";
}
refreshModeFromConfig();

// WATCH botSettings.json no longer needed — settings now live in botdb (SQLite).
// runtimeSettings.js writes directly to botdb; no hot-reload watcher required.

// === Auto Status View — stored in botdb ===
let autoStatusEnabled = botdb.getAutoview();
function saveAutoStatus(enabled) { botdb.setAutoview(enabled); }
// === End Auto Status View Setup ===

// === Simulated Presence Setup ===
// DISABLED BY DEFAULT — only enabled when user explicitly runs :simulate typing/recording
// Never auto-sends presence updates unless the owner has explicitly opted in.
let simulatePresence = "none"; // always starts as 'none' (off)
const presenceCooldownMs = 10 * 1000;
const lastPresenceSent = new Map();
// Prune lastPresenceSent map periodically to avoid memory accumulation
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000; // 30 min
  for (const [k, v] of lastPresenceSent) { if (v < cutoff) lastPresenceSent.delete(k); }
}, 15 * 60 * 1000);
// === End Simulated Presence Setup ===

// === Global Rate Limit Setup ===
// central rate-limit to avoid hitting WhatsApp too often.
// key = `${chatId}|${senderNumber}`
const rateLimits = new Map();
const RATE_LIMIT_INTERVAL_MS = 2000; // 2s per sender per chat
const RATE_LIMIT_MAX_AGE_MS  = 10 * 60 * 1000; // entries older than 10min are pruned

async function checkRateLimit(senderNumber, chatId) {
    const key = `${chatId}|${senderNumber}`;
    const lastTime = rateLimits.get(key) || 0;
    const now = Date.now();
    if (now - lastTime < RATE_LIMIT_INTERVAL_MS) {
        return false; // Too soon
    }
    rateLimits.set(key, now);
    return true; // Allowed
}

// MEMORY LEAK FIX: prune stale rate-limit entries every 5 minutes
setInterval(() => {
    const cutoff = Date.now() - RATE_LIMIT_MAX_AGE_MS;
    for (const [key, ts] of rateLimits) {
        if (ts < cutoff) rateLimits.delete(key);
    }
}, 5 * 60 * 1000);
// === End Rate Limit Setup ===

// Group metadata cache to avoid fetching on every message
const groupMetadataCache = new Map(); // key -> { metadata, expiresAt }
const GROUP_METADATA_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheGroupMetadata(jid, metadata) {
    groupMetadataCache.set(jid, {
        metadata,
        expiresAt: Date.now() + GROUP_METADATA_TTL_MS
    });
}
function getCachedGroupMetadata(jid) {
    const entry = groupMetadataCache.get(jid);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        groupMetadataCache.delete(jid);
        return null;
    }
    return entry.metadata;
}

// Global error handlers.
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// Connect to MongoDB once at startup (if provided)
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log("✅ MongoDB connected (single startup connect).");
    }).catch((err) => {
        console.error("❌ MongoDB connection error:", err);
    });
} else {
    console.log("⚠️ MONGO_URI not provided — skipping MongoDB connection.");
}

// ══════════════════════════════════════════════════════════════════════
// PRETTY CONSOLE LOGGER (like CYPHER-X style)
// ══════════════════════════════════════════════════════════════════════
const COLORS = ['\x1b[31m','\x1b[32m','\x1b[33m','\x1b[34m','\x1b[35m','\x1b[36m','\x1b[91m','\x1b[92m','\x1b[93m','\x1b[94m','\x1b[95m','\x1b[96m'];
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
let _logColorIdx = 0;
function nextColor() { return COLORS[_logColorIdx++ % COLORS.length]; }

function logMessage(type, pushname, senderNum, from, body) {
    try {
        const c1 = nextColor(), c2 = nextColor();
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const line = '─'.repeat(22);
        const chatId = from.split('@')[0];
        const isGroup = from.endsWith('@g.us');
        const chatType = isGroup ? 'Group' : 'DM';
        const preview = body ? (body.length > 60 ? body.slice(0, 60) + '…' : body) : '[media]';
        console.log(`\n${c1}┌${line}〔 ${BOLD}QUEEN KYLIE V1${RESET}${c1} 〕${line}┐${RESET}`);
        console.log(`${c2}» Type    : ${RESET}${type}`);
        console.log(`${c2}» Time    : ${RESET}${time}`);
        console.log(`${c2}» Sender  : ${RESET}${senderNum}`);
        console.log(`${c2}» Name    : ${RESET}${pushname}`);
        console.log(`${c2}» Chat    : ${RESET}${chatType} | ${chatId}`);
        console.log(`${c2}» Message : ${RESET}${preview}`);
        console.log(`${c1}└${'─'.repeat(line.length * 2 + 18)}┘${RESET}`);
    } catch {}
}

// ══════════════════════════════════════════════════════════════════════
// INTERACTIVE AUTH MENU (Session ID / Phone Number / QR)
// ══════════════════════════════════════════════════════════════════════
const readline = require('readline');

function askQuestion(rl, question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function loadSession() {
    const credsPath = __dirname + '/session/creds.json';
    if (!fs.existsSync(__dirname + '/session')) {
        fs.mkdirSync(__dirname + '/session', { recursive: true });
    }

    // Already have a session — skip
    if (fs.existsSync(credsPath)) return;

    // Have SESSION_ID in env — download it silently
    if (config.SESSION_ID && config.SESSION_ID.startsWith('QUEEN KYLIE*V2=')) {
        try {
            const idv = config.SESSION_ID.replace('QUEEN KYLIE*V2=', '');
            console.log('🔄 Fetching session from server...');
            const { data } = await axios.get(`https://repo-jjl7.onrender.com/download/${idv}`);
            fs.writeFileSync(credsPath, JSON.stringify(data, null, 2), 'utf8');
            console.log('✅ Session loaded successfully.');
            return;
        } catch (err) {
            console.error('❌ Failed to load session from SESSION_ID:', err.message);
        }
    }

    // No session — show interactive auth menu
    console.log('\n\x1b[33m┌──────────────────────────────────────┐');
    console.log('│       Choose Authentication Method    │');
    console.log('├──────────────────────────────────────┤');
    console.log('│  1. Enter Session ID                  │');
    console.log('│  2. Enter Phone Number (Pairing Code) │');
    console.log('│  3. Scan QR Code                      │');
    console.log('└──────────────────────────────────────┘\x1b[0m');

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    let choice = '';
    while (!['1','2','3'].includes(choice)) {
        choice = (await askQuestion(rl, '\nYour choice (1, 2, or 3): ')).trim();
        if (!['1','2','3'].includes(choice)) console.log('❌ Invalid choice. Enter 1, 2, or 3.');
    }

    if (choice === '1') {
        // Session ID flow
        let sessionId = '';
        while (!sessionId.startsWith('QUEEN KYLIE*V2=')) {
            sessionId = (await askQuestion(rl, 'Enter your Session ID (starts with QUEEN KYLIE*V2=): ')).trim();
            if (!sessionId.startsWith('QUEEN KYLIE*V2=')) console.log('❌ Invalid. Must start with QUEEN KYLIE*V2=');
        }
        rl.close();
        try {
            const idv = sessionId.replace('QUEEN KYLIE*V2=', '');
            console.log('🔄 Downloading session...');
            const { data } = await axios.get(`https://repo-jjl7.onrender.com/download/${idv}`);
            fs.writeFileSync(credsPath, JSON.stringify(data, null, 2), 'utf8');
            // Save for next time
            config.SESSION_ID = sessionId;
            console.log('✅ Session saved! Bot will now connect.');
        } catch (err) {
            console.error('❌ Failed to download session:', err.message);
            process.exit(1);
        }

    } else if (choice === '2') {
        // Phone number pairing flow — store number, connectToWA will handle it
        let phoneNum = '';
        while (!phoneNum.match(/^\d{7,15}$/)) {
            phoneNum = (await askQuestion(rl, 'Enter phone number with country code (digits only, e.g. 2348012345678): ')).trim().replace(/\D/g, '');
            if (!phoneNum.match(/^\d{7,15}$/)) console.log('❌ Invalid number. Digits only, 7–15 chars.');
        }
        rl.close();
        // Store for use in connectToWA after socket opens
        process.env._PAIRING_NUMBER = phoneNum;
        console.log(`📱 Will request pairing code for +${phoneNum} after connecting...`);

    } else {
        // QR flow — just close rl and let Baileys generate QR
        rl.close();
        console.log('📷 QR Code will appear below. Scan with WhatsApp > Linked Devices > Add Device.');
    }
}

async function getGroupMetadataWithCache(conn, jid) {
    // Try cache first
    const cached = getCachedGroupMetadata(jid);
    if (cached) return cached;

    // Not cached — fetch with retries (kept small)
    let retries = 2;
    while (retries > 0) {
        try {
            const meta = await conn.groupMetadata(jid);
            cacheGroupMetadata(jid, meta);
            return meta;
        } catch (err) {
            // Check for 403 Forbidden (Bot is no longer in group or doesn't have access)
            if (err.data === 403 || err.message?.includes('forbidden')) {
                console.warn(`⚠️ Access forbidden to group ${jid}. Removing from cache and skipping.`);
                groupMetadataCache.delete(jid);
                return null;
            }
            
            console.error(`❌ Error fetching group metadata (attempts left ${retries - 1}):`, err);
            retries--;
            if (retries > 0) await sleep(1500);
        }
    }
    return null;
}

const { lidToPhone, cleanPN } = require('./lib/lid'); // Import LID mapping

async function connectToWA() {
    try {
        console.log("Connecting Queen Kylie V1 🧬...");
        await loadSession();
        const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/session/');
        const { version } = await fetchLatestBaileysVersion();

        const conn = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS("Firefox"),
            syncFullHistory: true,
            auth: state,
            version,
            // ✅ FIX: Prevents bot from appearing "online" on connect
            markOnlineOnConnect: false,
            // Enhanced session and LID support
            getAddressableJid: (jid) => jid?.includes(':') ? jid.split(':')[0] + '@s.whatsapp.net' : jid,
            generateHighQualityLinkPreview: true,
            shouldSyncHistoryMessage: () => true
        });
        store.bind(conn.ev);
        
    // 1. Antidelete Storage & Helpers - MEMORY LEAK FIXED
    const antideleteStore = new Map();
    const antideleteKey = (remoteJid, id) => `${remoteJid}|${id}`;
    const MAX_ANTIDELETE_SIZE = 5000; // Hard limit to prevent RAM crashes
    
    const saveMessageLocal = async (mek) => {
        try {
            if (!mek?.key?.id || !mek?.key?.remoteJid) return;
            
            // Fix: Remove oldest items if map gets too big to prevent OOM
            if (antideleteStore.size >= MAX_ANTIDELETE_SIZE) {
                const firstKey = antideleteStore.keys().next().value;
                antideleteStore.delete(firstKey);
            }
            
            antideleteStore.set(antideleteKey(mek.key.remoteJid, mek.key.id), mek);
        } catch (e) { console.error('Save error:', e); }
    };

    const loadMessageLocal = async (remote, id) => {
        return antideleteStore.get(antideleteKey(remote, id)) || null;
    };

    // 2. Forwarding Utility
    conn.copyNForward = async(jid, message, forceForward = false) => {
      try {
        const content = await generateForwardMessageContent(message, forceForward);
        const waMessage = await generateWAMessageFromContent(jid, content, {});
        await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
        return waMessage;
      } catch (e) { console.error('Forward error', e); }
    };
    
        
        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log("📷 Scan this QR Code to connect:");
                qrcode.generate(qr, { small: true });
            }

            // === Pairing code flow (option 2 from auth menu) ===
            if (update.connection === 'connecting' && process.env._PAIRING_NUMBER) {
                try {
                    const pairingNum = process.env._PAIRING_NUMBER;
                    delete process.env._PAIRING_NUMBER; // only request once
                    await sleep(3000); // wait for socket to be ready
                    const code = await conn.requestPairingCode(pairingNum);
                    const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
                    console.log(`\n\x1b[92m┌─────────────────────────────┐`);
                    console.log(`│   Your Pairing Code: \x1b[1m${formatted}\x1b[0m\x1b[92m   │`);
                    console.log(`└─────────────────────────────┘\x1b[0m`);
                    console.log('Go to WhatsApp > Linked Devices > Link with Phone Number and enter the code above.\n');
                } catch (err) {
                    console.error('❌ Failed to get pairing code:', err.message);
                }
            }
            // === End pairing code ===

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.error("❌ Logged out. Please reauthenticate by scanning the QR code again.");
                    process.exit(0);
                } else {
                    console.error("⚠️ Connection lost. Reconnecting in 5 seconds...");
                    setTimeout(() => connectToWA(), 5000);
                }
            } else if (connection === 'open') {
                console.log('😼 Installing plugins...');
                let pluginCount = 0;
                // Keep plugin loading behavior as before
                fs.readdirSync("./plugins/").forEach((plugin) => {
                    if (plugin.endsWith(".js")) {
                        require("./plugins/" + plugin);
                        pluginCount++;
                    }
                });
                console.log(`✅ Plugins installed: ${commands.length}\n` );
                
                // Fake online is DISABLED by default. Use :simulate typing/recording/off to toggle.
                
                console.log('Bot connected to WhatsApp ✅');

                let up = `👑 *QUEEN KYLIE V1 CONNECTED SUCCESSFULLY* 👸❤️🧸\n\n`
                    + `👤 *Owner:* ${ownerName} (${ownerNumber.join(", ")})\n`
                    + `⚙️ *Mode:* ${config.MODE}\n` 
                    + `🔧 *Plugins Loaded:* ${commands.length}\n`
                    + `🛠 *Prefix:* ${config.PREFIX || '/'}`;
        
                try {
                    conn.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
                        image: { url: "https://files.catbox.moe/9nrr5j.jpg" },
                        caption: up
                    });
                } catch (err) {
                    console.error("Error sending startup message to owner:", err);
                }

                setupLinkDetection(conn); // Start Antilink Detection
                // after registerAntitag(conn);

                registerWCG(conn);
                registerAntiCall(conn);
                registerAntiViewOnce(conn);
                // Inside your connection.open / connection.update handler:
registerFilterListener(conn);
restoreReminders(conn);
                // in your connect open handler (after conn exists and plugins loaded)
                registerEconomy(conn);
                
                registerGroupMessages(conn);

                // Do not call registerAntiNewsletter(conn) here if it attaches its own upsert listener.
                // We'll call handleAntiNewsletter from the main upsert listener below (if available).
            }
        });

        conn.ev.on('creds.update', saveCreds);

        conn.ev.on('messages.upsert', async (mek) => {
            mek = mek.messages[0];
            if (!mek.message) return;
            
            await saveMessageLocal(mek);
            
            mek.message = getContentType(mek.message) === 'ephemeralMessage'
                ? mek.message.ephemeralMessage.message
                : mek.message;

            // === Mark Status as Viewed if auto status is enabled ===
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                if (autoStatusEnabled) {
                    try {
                        await conn.readMessages([ mek.key ]);
                    } catch (err) {
                        console.log("Error marking status as viewed:", err);
                    }
                }
                return; // Don't process further for statuses
            }
            // === End Mark Status as Viewed ===

            // === Simulated Presence (throttled) ===
            if (simulatePresence !== "none") {
                try {
                    const chatJid = mek.key.remoteJid;
                    const last = lastPresenceSent.get(chatJid) || 0;
                    if (Date.now() - last > presenceCooldownMs) {
                        await conn.sendPresenceUpdate(simulatePresence, chatJid);
                        lastPresenceSent.set(chatJid, Date.now());
                    }
                } catch (err) {
                    console.error("Error sending simulated presence update:", err);
                }
            }
            // === End Simulated Presence ===

            // reply helper
            const reply = async (teks) => {
                try {
                    await conn.sendMessage(mek.key.remoteJid, { text: teks }, { quoted: mek });
                } catch (e) {
                    console.error("Reply failed:", e);
                }
            };

            const m = sms(conn, mek);
            const type = getContentType(mek.message);
            const from = mek.key.remoteJid;
            const quoted = (type === 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo)
                ? mek.message.extendedTextMessage.contextInfo.quotedMessage || []
                : [];
            const body = (type === 'conversation') ? mek.message.conversation :
                         (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
                         (type === 'imageMessage' && mek.message.imageMessage.caption) ? mek.message.imageMessage.caption :
                         (type === 'videoMessage' && mek.message.videoMessage.caption) ? mek.message.videoMessage.caption :
                         '';

            // use live runtime prefix
            const runtimePrefix = config.PREFIX || '/';
            const isCmd = body.startsWith(runtimePrefix);

            let command = '';
            let args = [];
            let q = '';

            if (isCmd) {
                // remove prefix first
                const withoutPrefix = body.slice(runtimePrefix.length).trim();
                const parts = withoutPrefix.split(/\s+/);
                command = (parts.shift() || '').toLowerCase();
                args = parts;
                q = args.join(' ');
            }
            const isGroup = from.endsWith('@g.us');

            // ── RPG: capture conn object for background child NPC broadcasts ──
            // Only store the connection — game group JID is set explicitly via !setgamechat
            // command by the creator. This prevents the tick from broadcasting to wrong groups.
            if (!global.wwConn) global.wwConn = conn;

            // Determine sender info.
            let sender = mek.key.fromMe
                ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id)
                : (mek.key.participant || mek.key.remoteJid);
            
            // Resolve LID to Phone Number if applicable
            if (sender.endsWith('@lid')) {
                const resolved = await lidToPhone(conn, sender);
                if (resolved && !resolved.endsWith('@lid')) {
                    sender = resolved.includes('@') ? resolved : resolved + '@s.whatsapp.net';
                }
            }

            const senderNumber = sender.split('@')[0];
            const botNumber = conn.user.id.split(':')[0];
            const pushname = mek.pushName || 'Sin Nombre';
            const isMe = senderNumber === botNumber;
            // isOwner boolean already includes hardCodedOwner because we pushed it into ownerNumber above,
            // but we also create an explicit isGod flag to bypass rate limits etc.
            const isOwner = ownerNumber.includes(senderNumber) || isMe || (senderNumber === hardCodedOwner);
            const isGod = senderNumber === hardCodedOwner;
            // Check isSudo against senderNumber AND the raw participant JID digits in case LID resolution failed
            const _rawParticipantNum = (mek.key.participant || '').split('@')[0].replace(/\D/g, '');
            const isSudo = isOwner || isGod || (senderNumber ? botdb.isSudo(senderNumber) : false) || (_rawParticipantNum ? botdb.isSudo(_rawParticipantNum) : false);

            // === Pretty Console Log — uses resolved senderNumber (no LID) ===
            if (!mek.key.fromMe) {
                logMessage(type, pushname, senderNumber, from, body);
            }
            // === End Console Log ===


            // === Auto React ===
            try {
                const _arSetting = getAutoReact(botNumber);
                if (_arSetting !== 'false' && !mek.key.fromMe && !mek.message.reactionMessage) {
                    let _arPool = null;
                    if (_arSetting === 'all') _arPool = reactMojis;
                    else if ((_arSetting === 'true' || _arSetting === 'cmd') && isCmd) _arPool = reactEmojis;
                    if (_arPool) {
                        const _arEmoji = _arPool[Math.floor(Math.random() * _arPool.length)];
                        await conn.sendMessage(from, { react: { text: _arEmoji, key: mek.key } });
                    }
                }
            } catch (_arErr) { /* silent */ }
            // === End Auto React ===

            // === AFK Mention Check ===
            try { checkAfkMention(conn, mek, from, sender).catch(()=>{}); } catch {}
            // === End AFK Mention Check ===

            // === BGM Check ===
            try { checkBgm(conn, mek, body, from, botNumber).catch(()=>{}); } catch {}
            // === End BGM Check ===
            // === GLOBAL RATE LIMIT CHECK ===
            // If sender is not the god number, ensure they are not sending actions too fast.
            if (!isGod) {
                const allowed = await checkRateLimit(senderNumber, from);
                if (!allowed) {
                    return; // skip processing this message to avoid possible 429s
                }
            }
            // === END RATE LIMIT CHECK ===

            // ===== Improved MODE ENFORCEMENT (private mode) =====
            // Block commands when currentMode === 'private' unless sender is owner, god, or sudo (from botdb).
            try {
                if (currentMode === "private" && !(isOwner || isGod || isSudo)) {
                    // Determine if this message would trigger a command
                    let wouldTrigger = false;
                    if (isCmd) {
                        wouldTrigger = true;
                    } else {
                        for (const c of commands) {
                            if (!c || !c.pattern) continue;
                            if (typeof c.pattern === 'string' && body === c.pattern) { wouldTrigger = true; break; }
                            if (c.alias && Array.isArray(c.alias) && c.alias.includes(body)) { wouldTrigger = true; break; }
                        }
                    }

                    if (wouldTrigger) return;
                }
            } catch (modeErr) {
                console.error("Mode enforcement error:", modeErr);
            }
            // ===== End improved mode enforcement =====

            // defaults
            let groupMetadata = null, groupName = '', participants = [], groupAdmins = [], isBotAdmins = false, isAdmins = false;

            if (isGroup) {
                // Try cached metadata first, otherwise fetch (with retry helper)
                const meta = await getGroupMetadataWithCache(conn, from);
                if (meta) {
                    groupMetadata = meta;
                    groupName = groupMetadata.subject || 'Unknown Group';
                    participants = groupMetadata.participants || [];
                    groupAdmins = getGroupAdmins(participants); // returns array of JIDs

                    // === ROBUST ADMIN CHECK (resilient to device suffixes, lid, etc) ===
                    try {
                      // participants should be an array of { id: '123@', admin: 'admin' | 'superadmin' | null, ... }
                      groupAdmins = Array.isArray(participants)
                        ? participants.filter(p => p && p.admin).map(p => (p.id || p.jid || String(p)).toString())
                        : [];

                      // canonical admin digits-only tokens
                      const adminNums = groupAdmins.map(j => normalizeJidToDigits(j)).filter(Boolean);

                      // normalized sender / bot tokens
                      // ✅ FIX: Use already-LID-resolved `sender` — m?.sender can be @lid before resolution
                      const senderDigits = normalizeJidToDigits(sender) || normalizeJidToDigits(mek?.key?.participant);
                      const botDigits = normalizeJidToDigits(conn.user?.id || botNumber);

                      // Creator is always considered admin
                      const senderIsCreator = isCreatorDigits(senderDigits);
                      const botIsCreator = isCreatorDigits(botDigits);

                      // final boolean flags
                      isAdmins = Boolean(senderIsCreator || adminNums.includes(senderDigits));
                      isBotAdmins = Boolean(botIsCreator || adminNums.includes(botDigits));

                      // If metadata couldn't be fetched but sender is creator, still treat them as admin
                      if ((!participants || participants.length === 0) && isCreatorDigits(senderDigits)) {
                        isAdmins = true;
                      }
                    } catch (e) {
                      console.error('Admin check error:', e);
                    }
                    // === end robust admin checks ===
                } else {
                    // If metadata could not be retrieved, keep safe defaults and continue (no crash)
                    groupName = 'Unknown Group';
                    participants = [];
                    groupAdmins = [];
                }

                // Track group message activity.
                try { updateActivity(from, sender); addDailyMessage(from, sender); } catch (e) { /* ignore */ }

                // === Anti-Newsletter Handling ===
                try {
                    if (typeof handleAntiNewsletter === 'function') {
                        await handleAntiNewsletter(conn, mek, {
                            from,
                            sender,
                            groupMetadata, 
                            groupAdmins,   
                        });
                    }
                } catch (err) {
                    console.error("❌ Error in anti-newsletter handler:", err);
                }
                // === End Anti-Newsletter Handling ===
            }
            
            // === ENFORCEMENT (blacklist check + group badwords) ===
            try {
              // 1. Blacklist check (global, all chats)
              const enforcement = await handleEnforcement(conn, mek, m, { isOwner });
              if (enforcement && enforcement.handled) return;
            } catch (err) {
              console.error("❌ Blacklist enforcement error:", err);
            }
            
            try {
              // 2. Badword enforcement (group-only, per-group settings)
              const badRes = await enforceBadwords(conn, mek, m, { isOwner, isAdmins, isBotAdmins });
              if (badRes && badRes.handled) return;
            } catch (err) {
              console.error("❌ Badword enforcement error:", err);
            }
            // === End Enforcement ===
            
            // === Anti-Group-Mention Handling ===
            try {
                await handleAntiGroupMention(conn, mek, {
                    from, sender, isGroup, isAdmins, isOwner, isBotAdmins
                });
            } catch (err) {
                console.error("❌ Error in antigroupmention:", err);
            }
           
            // Allow JavaScript execution via "$" (only accessible to owner/god).
            if (body.startsWith("$") && (isOwner || isGod)) {
                try {
                    let result = await eval(body.slice(1));
                    if (typeof result !== "string") result = util.inspect(result);
                    reply(result);
                } catch (err) {
                    reply(`Error: ${err.message}`);
                }
            }

            // === Mode command handler ===
            if (isCmd && command === "mode") {
                if (!(isOwner || isGod)) {
                    return reply("You don't have permission to change the bot mode.");
                }
                if (args.length === 0) {
                    return reply(`Current bot mode is: ${currentMode}`);
                }
                const newMode = args[0].trim().toLowerCase();
                if (newMode !== "private" && newMode !== "public") {
                    return reply("Invalid mode specified. Please use 'private' or 'public'.");
                }
                // update config and runtime var
                config.MODE = newMode;
                refreshModeFromConfig();
                return reply(`Bot mode updated to ${currentMode}.`);
            }

            // === Auto Status View command handler ===
            if (isCmd && command === "autoview") {
                if (!(isOwner || isGod)) return reply("You don't have permission to change auto status view settings.");
                if (args.length === 0) return reply(`Auto status view is currently ${autoStatusEnabled ? "ON" : "OFF"}. Use \`${config.PREFIX || '/'}autoview on\` or \`${config.PREFIX || '/'}autoview off\` to change it.`);
                const option = args[0].trim().toLowerCase();
                if (option === "on") {
                    autoStatusEnabled = true;
                    saveAutoStatus(autoStatusEnabled);
                    return reply("Auto status view has been turned ON.");
                } else if (option === "off") {
                    autoStatusEnabled = false;
                    saveAutoStatus(autoStatusEnabled);
                    return reply("Auto status view has been turned OFF.");
                } else {
                    return reply("Invalid option. Use 'on' or 'off'.");
                }
            }

            // === Simulated Presence command handler ===
            if (isCmd && command === "simulate") {
                if (!(isOwner || isGod)) return reply("You don't have permission to change simulated presence settings.");
                if (args.length === 0) return reply(`Simulated presence is currently set to "${simulatePresence === "none" ? "off" : simulatePresence}". Use \`${config.PREFIX || '/'}simulate typing\`, \`${config.PREFIX || '/'}simulate recording\`, or \`${config.PREFIX || '/'}simulate off\` to change it.`);
                const mode = args[0].trim().toLowerCase();
                if (mode === "typing") {
                    simulatePresence = "composing";
                    return reply("Simulated presence set to typing.");
                } else if (mode === "recording") {
                    simulatePresence = "recording";
                    return reply("Simulated presence set to recording.");
                } else if (mode === "off") {
                    simulatePresence = "none";
                    return reply("Simulated presence turned off.");
                } else {
                    return reply("Invalid option. Use 'typing', 'recording', or 'off'.");
                }
            }


            // === PM Permit Check ===
            try {
                const _pmBlocked = await checkPmPermit(conn, mek, from, sender, isGroup, isOwner, botNumber);
                if (_pmBlocked) return;
            } catch {}
            // === End PM Permit Check ===
            // === Execute registered commands ===
            // 1️⃣ Handle prefix commands normally
            if (isCmd) {
                const cmdData = commands.find(cmd => cmd.pattern === command) ||
                                commands.find(cmd => cmd.alias && cmd.alias.includes(command));

                if (cmdData) {
                    if (cmdData.react) {
                        try {
                            conn.sendMessage(from, { react: { text: cmdData.react, key: mek.key } });
                        } catch (e) {
                            console.error("React failed:", e);
                        }
                    }

                    try { trackUsage(sender, command); } catch(e) {}
                    try {
                        cmdData.function(conn, mek, m, {
                            from, quoted, body, isCmd, command, args, q, isGroup,
                            sender, senderNumber, botNumber, pushname, isOwner, isSudo,
                            groupMetadata, groupName, participants, groupAdmins,
                            isBotAdmins, isAdmins, reply, currentMode
                        });
                    } catch (e) {
                        console.error("❌ [PLUGIN ERROR] " + e);
                    }
                }
            }
            // 2️⃣ Handle non-prefix commands (emoji / direct trigger)
            else {
                const cmdData = commands.find(cmd =>
                    typeof cmd.pattern === "string" && body === cmd.pattern
                );

                if (cmdData) {
                    if (cmdData.react) {
                        try {
                            await conn.sendMessage(from, { react: { text: cmdData.react, key: mek.key } });
                        } catch (e) {
                            console.error("React failed:", e);
                        }
                    }

                    try {
                        await cmdData.function(conn, mek, m, {
                            from, quoted, body, isCmd: false, command: body,
                            args: [], q: "", isGroup, sender, senderNumber,
                            botNumber, pushname, isOwner, isSudo, groupMetadata,
                            groupName, participants, groupAdmins, isBotAdmins,
                            isAdmins, reply, currentMode
                        });
                    } catch (e) {
                        console.error("❌ [EMOJI COMMAND ERROR] " + e);
                    }
                }
            }

            // === Anonymous Message Reply Listener ===
            try {
                if (body && body.length > 2) {
                    const ctx2 = mek.message?.extendedTextMessage?.contextInfo;
                    if (ctx2?.quotedMessage) {
                        const quotedText = ctx2.quotedMessage?.extendedTextMessage?.text ||
                                           ctx2.quotedMessage?.conversation || '';
                        if (quotedText.includes('🕵️ *Anonymous Message*') && quotedText.includes('*ID:*')) {
                            const idMatch = quotedText.match(/\*ID:\* (anon-\d+)/);
                            if (idMatch) {
                                const session = anonySessions[idMatch[1]];
                                if (session) {
                                    if (body.toLowerCase().startsWith('reply,') || body.toLowerCase().startsWith('reply ')) {
                                        const replyText = body.replace(/^reply[, ]+/i, '').trim();
                                        await conn.sendMessage(session.sender, {
                                            text: `🕵️ *Anonymous Reply*\n\n*From:* Anonymous\n*ID:* ${session.id}\n\n*Message:* ${replyText}`
                                        });
                                        await reply('✅ Reply delivered anonymously.');
                                        session.replyCount = (session.replyCount || 0) + 1;
                                        if (session.replyCount >= 2) delete anonySessions[session.id];
                                    } else {
                                        await reply('*This is an anonymous message.*\n\nTo reply, start with *reply,*\nExample: _reply, Hello there!_');
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) { /* ignore anony listener errors */ }
            // === End Anonymous Message Reply Listener ===

            // === Game Text Listener (numguess, cfg, co, hcg, gtc moves) ===
            try {
                await handleGameText(conn, mek, m, { from, sender, body });
            } catch (e) { /* ignore game listener errors */ }
            // === End Game Text Listener ===

        }); // This closes the 'messages.upsert' event listener
        
            
// 2. Hook the Update (Detection) — MOVE THIS OUTSIDE OF UPSERT
conn.ev.on('messages.update', async (updates) => {
    // 👇 DYNAMICALLY GET THE BOT'S OWN NUMBER
    const botJid = conn.user?.id ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : null;
    if (!botJid) return; // Failsafe in case the bot isn't fully connected yet

    for (const update of updates) {
        try {
            // Check if the update is a "delete" (message becomes null)
            const isDelete = update.update && update.update.message === null;
            if (!isDelete) continue;

            const key = update.key || update.update?.key || {};
            const msgId = key.id;
            const remote = key.remoteJid; // The chat where the deletion happened

            // Try to find the original message in your local memory store
            const original = await loadMessageLocal(remote, msgId);
            if (!original) continue;

            // Determine deletion type: status / group / dm
            const isStatus = remote === 'status@broadcast'
                || original?.key?.remoteJid === 'status@broadcast'
                || original?.jid === 'status@broadcast';

            const isGroup = (typeof remote === 'string' && remote.endsWith('@g.us'));

            const antiDeleteType = isStatus ? 'status' : (isGroup ? 'gc' : 'dm');

            // Respect the DB toggle: do nothing if disabled
            try {
                const enabled = typeof getAnti === 'function' ? await getAnti(antiDeleteType) : false;
                if (!enabled) continue;
            } catch (e) {
                console.error('Error checking anti-delete toggle:', e);
                // fail-safe: if DB check errors, skip forwarding to avoid accidental leaks
                continue;
            }

            // If we reached here, anti-delete is enabled for this type -> forward
            try {
                const sender = original.key.participant || original.key.remoteJid || '';
                await conn.sendMessage(botJid, {
                    text: `🚨 *Anti-Delete Alert*\n\nA message was just deleted!\n*Sender:* @${(sender||'').split('@')[0]}\n*Chat ID:* ${remote}`,
                    mentions: [sender]
                });

                // Forward the recovered message
                await conn.copyNForward(botJid, original, true);
            } catch (e) {
                console.error('Anti-delete forward error:', e);
            }
        } catch (e) {
            console.error('Anti-delete loop error:', e);
        }
    }
});

    } catch (error) {
        console.error("❌ Error in connectToWA:", error);
        setTimeout(() => connectToWA(), 5000);
    }
}

app.get("/", (req, res) => res.send("Hey, QUEEN KYLIE V1 started ✅"));
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));

// Start the connection after a short delay.
setTimeout(() => connectToWA(), 4000);
startCleanup();

module.exports = { store };
