import {
  SlashCommandBuilder,
  CommandInteraction,
  GuildMember,
  EmbedBuilder,
  AttachmentBuilder,
  MessageFlags,
} from "discord.js";
import db from "@/utils/database";
import type Command from "@/interfaces/slashCommand";
import { ensureUserExists } from "@/utils/userUtils";
import { giveCurrency } from "@/utils/currencyUtils";

interface DailyClaim {
  streak: number;
  last_claim: string;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect daily rewards."),
  async execute(interaction: CommandInteraction) {
    const member = interaction.member as GuildMember | null;

    if (!member) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await ensureUserExists(member);

    try {
      let dailyClaim = await db.get<DailyClaim>(
        `SELECT * FROM daily_claim WHERE user_id = $userId`,
        { $userId: member.id }
      );

      const now = new Date();
      let streak = 1;
      let message = "New streak created";

      if (dailyClaim) {
        const lastClaim = new Date(dailyClaim.last_claim);
        const hoursSinceLastClaim =
          (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastClaim >= 48) {
          streak = 1;
          message = "Your streak has been reset! Starting a new streak.";
        } else if (hoursSinceLastClaim >= 24) {
          streak = dailyClaim.streak == 7 ? 7 : dailyClaim.streak + 1;
          message = `Streak increased to ${streak}!`;
        } else {
          const hoursLeft = 24 - hoursSinceLastClaim;
          const minutesLeft = Math.floor((hoursLeft % 1) * 60);
          const wholeHoursLeft = Math.floor(hoursLeft);
          await interaction.reply({
            content: `You can claim again in ${wholeHoursLeft}h ${minutesLeft}m!`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      // Update or insert daily claim record
      if (dailyClaim) {
        await db.run(
          `UPDATE daily_claim SET streak = $streak, last_claim = $now WHERE user_id = $userId`,
          {
            $userId: member.id,
            $streak: streak,
            $now: now.toISOString(),
          }
        );
      } else {
        await db.run(
          `INSERT INTO daily_claim (user_id, streak, last_claim) VALUES ($userId, $streak, $now)`,
          {
            $userId: member.id,
            $streak: streak,
            $now: now.toISOString(),
          }
        );
      }

      const konpeitoReward = 10 * streak + 50;
      const sugarCubesReward = 1000;

      const konpeitoBalance = await giveCurrency(
        member.id,
        "konpeito",
        konpeitoReward
      );
      const sugarCubesBalance = await giveCurrency(
        member.id,
        "sugar_cubes",
        sugarCubesReward
      );

      const embed = new EmbedBuilder()
        .setColor("#F77677")
        .setTitle(`｡°⊹ ☆. ${member.user.username}'s Daily Claim`)
        .setDescription("───────────────────────────── ･ ｡ﾟ")
        .addFields(
          {
            name: "┊ ʚ  <a:starspinred:1317224950007988336> **Rewards**",
            value: ` ╰  ${konpeitoReward} Konpeito Stars <a:konpeito:1317224873939959879> \n ╰  ${sugarCubesReward} Sugar Cubes <a:sugarcube:1317229194106638406>`,
          },
          {
            name: "┊ ʚ  <a:starspinwhite:1317224961160773693> **Streak**",
            value: ` ╰  ${streak} days`,
          },
          {
            name: "┊ ʚ  <a:starspinred:1317224950007988336> **Updated Balance**",
            value: ` ╰  ${konpeitoBalance} Konpeito Stars <a:konpeito:1317224873939959879> \n ╰  ${sugarCubesBalance} Sugar Cubes <a:sugarcube:1317229194106638406>`,
          }
        )
        .setThumbnail(member.user.displayAvatarURL() || "");

      await interaction.reply({
        content: message,
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error processing daily claim:", error);
      await interaction.reply({
        content: "An error occurred while processing your daily claim.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
