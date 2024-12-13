import {
  SlashCommandBuilder,
  CommandInteraction,
  GuildMember,
  EmbedBuilder,
} from "discord.js";
import db from "@/utils/database";
import type Command from "@/interfaces/slashCommand";
import type { Profile } from "@/interfaces/database";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Displays your profile information."),
  async execute(interaction: CommandInteraction) {
    const member = interaction.member as GuildMember | null;
    const profile = await db.get<Profile>(
      `SELECT * FROM profiles WHERE user_id = $id`,
      {
        $id: member?.id,
      }
    );

    const embed = new EmbedBuilder()
      .setTitle("Profile")
      .setDescription(`${member?.user.username}'s profile`)
      .addFields(
        { name: "Username", value: profile?.username || "N/A" },
        { name: "Level", value: profile?.level.toString() || "N/A" },
        { name: "Experience", value: profile?.exp.toString() || "N/A" }
      )
      .setThumbnail(member?.user.displayAvatarURL() || "")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
