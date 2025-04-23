import {
  SlashCommandBuilder,
  CommandInteraction,
  GuildMember,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import db from "@/utils/database";
import type Command from "@/interfaces/slashCommand";
import { ensureUserExists } from "@/utils/userUtils";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("voicestats")
    .setDescription("Shows your voice chat statistics.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to check voice stats for (defaults to you)")
        .setRequired(false)
    ) as SlashCommandBuilder,
  async execute(interaction: CommandInteraction) {
    const targetUser =
      interaction.options.get("user")?.user || interaction.user;
    const targetMember = interaction.guild?.members.cache.get(targetUser.id);

    if (!targetMember) {
      await interaction.reply({
        content: "Could not find that user in this server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await ensureUserExists(targetMember);

    try {
      const currentSession = await db.get<{ joined_at: string }>(
        `SELECT joined_at FROM voice_sessions WHERE user_id = $userId`,
        { $userId: targetUser.id }
      );

      const profile = await db.get<{ total_voice_time: number }>(
        `SELECT total_voice_time FROM profiles WHERE user_id = $userId`,
        { $userId: targetUser.id }
      );

      // Calculate current session duration if in a voice channel
      let currentSessionDuration = 0;
      if (currentSession && targetMember.voice.channel) {
        const joinTime = new Date(currentSession.joined_at);
        const now = new Date();
        const durationMs = now.getTime() - joinTime.getTime();
        currentSessionDuration = Math.floor(durationMs / (1000 * 60)); // in minutes
      }

      const embed = new EmbedBuilder()
        .setColor("#F77677")
        .setTitle(`${targetUser.username}'s Voice Stats`)
        .setDescription("───────────────────────────── ･ ｡ﾟ")
        .setThumbnail(targetUser.displayAvatarURL() || "");

      if (currentSession && targetMember.voice.channel) {
        embed.addFields({
          name: "┊ ʚ  🎤 **Current Session**",
          value: ` ╰  In ${targetMember.voice.channel.name} for ${currentSessionDuration} minutes`,
        });
      } else {
        embed.addFields({
          name: "┊ ʚ  🎤 **Current Session**",
          value: ` ╰  Not in a voice channel`,
        });
      }

      // Add total voice time
      const totalHours = Math.floor((profile?.total_voice_time || 0) / 60);
      const totalMinutes = (profile?.total_voice_time || 0) % 60;
      embed.addFields({
        name: "┊ ʚ  ⏱️ **Total Voice Time**",
        value: ` ╰  ${totalHours}h ${totalMinutes}m`,
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching voice stats:", error);
      await interaction.reply({
        content: "An error occurred while fetching voice stats.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
