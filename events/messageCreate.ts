import { Events, Message, TextChannel } from "discord.js";
import { ensureUserExists } from "@/utils/userUtils";
import { processXpGain } from "@/utils/levelUtils";

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot) return;

    if (!message.guild) return;

    const member = message.member;
    if (!member) return;

    await ensureUserExists(member);

    try {
      // Process XP gain (default is 2 XP per message)
      const result = await processXpGain(member.id, 2, member);

      if (result.didLevelUp) {
        // Send a message to the channel about the level up
        // Here you can add additional level up rewards or events
        // For example:
        // - Give role rewards
        // - Send DM to user
        // - Trigger special events
      }
    } catch (err) {
      console.error("Error processing message for XP:", err);
    }
  },
};
