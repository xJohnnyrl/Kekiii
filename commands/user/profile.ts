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
import type { Profiles } from "@/interfaces/database";
import { ensureUserExists } from "@/utils/userUtils";
import { getUserLevel } from "@/utils/levelUtils";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Displays your profile information."),
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
      const userData = await db.get<Profiles & { username: string }>(
        `SELECT p.*, u.username FROM profiles p 
         JOIN users u ON p.user_id = u.user_id 
         WHERE p.user_id = $id`,
        { $id: member.id }
      );

      const levelInfo = await getUserLevel(member.id);

      // Calculate progress percentage
      const progressPercentage = Math.floor(
        (levelInfo.xp / levelInfo.xpRequired) * 100
      );

      const image = new AttachmentBuilder("./public/img/lace.gif");

      const embed = new EmbedBuilder()
        .setColor("#F77677")
        .setTitle(`｡°⊹ ☆. ${member.user.username}'s profile`)
        .setDescription("───────────────────────────── ･ ｡ﾟ")
        .addFields(
          {
            name: "┊ ʚ  <a:starspinred:1317224950007988336> **Balance**",
            value: ` ╰  ${userData?.balance_konpeito} Konpeito Stars <a:konpeito:1317224873939959879> \n ╰  ${userData?.balance_sugar_cubes} Sugar Cubes <a:sugarcube:1317229194106638406>`,
          },
          {
            name: "┊ ʚ  <a:starspinwhite:1317224961160773693> **Level**",
            value: ` ╰  ${userData?.level.toString()}` || "N/A",
          },
          {
            name: "┊ ʚ  <a:starspinred:1317224950007988336> **XP**",
            value: ` ╰  ${levelInfo.xp}/${levelInfo.xpRequired} (${progressPercentage}%)`,
          }
        )
        .setThumbnail(member.user.displayAvatarURL() || "")
        .setImage("attachment://lace.gif");

      await interaction.reply({ embeds: [embed], files: [image] });
    } catch (error) {
      console.error("Error fetching profile:", error);
      await interaction.reply({
        content: "An error occurred while fetching your profile.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
