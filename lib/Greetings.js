// lib/Greetings.js — Fixed: removed broken ../assets/database import
// Welcome / goodbye handler using the unified SQLite DB (lib/botdb.js)

'use strict';

const { getGreetings } = require('./botdb');
const { FiletypeFromUrl, parseJid, extractUrlFromMessage } = require('./functions');

async function getProfilePic(conn, jid) {
  try {
    return await conn.profilePictureUrl(jid, 'image');
  } catch {
    return 'https://getwallpapers.com/wallpaper/full/3/5/b/530467.jpg';
  }
}

async function sendGreetingMsg(conn, groupId, msg, participantJid) {
  const url = typeof extractUrlFromMessage === 'function' ? extractUrlFromMessage(msg) : null;
  if (url) {
    try {
      const { type, buffer } = await FiletypeFromUrl(url);
      const caption = msg.replace(url, '').trim();
      if (type === 'image' || type === 'video') {
        return conn.sendMessage(groupId, {
          [type]: buffer,
          caption,
          mentions: typeof parseJid === 'function' ? parseJid(msg) : [],
        });
      }
    } catch (e) {
      console.error('Greetings media fetch failed:', e?.message || e);
    }
  }
  return conn.sendMessage(groupId, {
    text: msg,
    mentions: typeof parseJid === 'function' ? parseJid(msg) : [],
  });
}

/**
 * Greetings(data, conn)
 * data = { id: groupJid, action: 'add'|'remove', participants: [jid, ...] }
 */
async function Greetings(data, conn) {
  try {
    const meta = await conn.groupMetadata(data.id).catch(() => null);
    const groupName  = meta?.subject || data.id;
    const memberCount = meta?.participants?.length || 0;
    const settings   = getGreetings(data.id);

    for (const user of data.participants) {
      const userNum = user.split('@')[0];
      const userPic  = await getProfilePic(conn, user);

      if (data.action === 'add' && settings.welcome_enabled) {
        const template = settings.welcome_msg ||
          "Welcome @{user} to {group}! We're glad to have you 🎉";
        const finalMsg = template
          .replace(/@user|\{user\}/gi, `@${userNum}`)
          .replace(/\{group\}/gi, groupName)
          .replace(/\{count\}/gi, memberCount);
        await conn.sendMessage(data.id, {
          image: { url: userPic }, caption: finalMsg, mentions: [user],
        }).catch(() => sendGreetingMsg(conn, data.id, finalMsg, user));
      }

      if (data.action === 'remove' && settings.goodbye_enabled) {
        const template = settings.goodbye_msg ||
          "Goodbye @{user} from {group}. We'll miss you! 👋";
        const finalMsg = template
          .replace(/@user|\{user\}/gi, `@${userNum}`)
          .replace(/\{group\}/gi, groupName)
          .replace(/\{count\}/gi, memberCount);
        await conn.sendMessage(data.id, {
          image: { url: userPic }, caption: finalMsg, mentions: [user],
        }).catch(() => sendGreetingMsg(conn, data.id, finalMsg, user));
      }
    }
  } catch (e) {
    console.error('Greetings error:', e);
  }
}

module.exports = Greetings;
