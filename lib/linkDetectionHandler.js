const { getLinkDetectionMode } = require("./linkDetection");
const { incrementWarning, resetWarning, getWarningCount } = require("./warningSystem");

const setupLinkDetection = (sock) => {
    sock.ev.on("messages.upsert", async ({ messages }) => {
        for (const message of messages) {
            const groupJid = message.key.remoteJid;

            if (!groupJid.endsWith("@g.us") || message.key.fromMe) continue;

            const mode = getLinkDetectionMode(groupJid);
            if (!mode) return;

            const msgText = message.message?.conversation || message.message?.extendedTextMessage?.text || "";
            const linkRegex = /(https?:\/\/[^\s]+)/g;

            if (linkRegex.test(msgText)) {
                console.log(`Detected link in group ${groupJid}: ${msgText}`);

                const participant = message.key.participant || message.participant;

                // Delete message
                await sock.sendMessage(groupJid, { delete: message.key });

                if (mode === "kick") {
                    await sock.groupParticipantsUpdate(groupJid, [participant], "remove");
                    await sock.sendMessage(groupJid, {
                        text: `@${participant.split("@")[0]} has been removed for sending links.`,
                        mentions: [participant],
                    });
                } else if (mode === "warn") {
                    const warningCount = incrementWarning(groupJid, participant);
                    await sock.sendMessage(groupJid, {
                        text: `@${participant.split("@")[0]}, links are not allowed!\nWarning count: ${warningCount}/3`,
                        mentions: [participant],
                    });

                    if (warningCount >= 3) {
                        await sock.groupParticipantsUpdate(groupJid, [participant], "remove");
                        await sock.sendMessage(groupJid, {
                            text: `@${participant.split("@")[0]} has been removed for multiple link violations.`,
                            mentions: [participant],
                        });
                        resetWarning(groupJid, participant);
                    }
                }
            }
        }
    });
};

module.exports = { setupLinkDetection };