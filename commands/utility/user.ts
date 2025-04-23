import {
  SlashCommandBuilder,
  CommandInteraction,
  GuildMember,
} from "discord.js";
import type Command from "@/interfaces/slashCommand";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Provides information about the user."),
  async execute(interaction: CommandInteraction) {
    const member = interaction.member as GuildMember | null;

    const joinedAt = member?.joinedAt
      ? member.joinedAt.toLocaleDateString()
      : "an unknown date";

    await interaction.reply(
      `This command was run by ${interaction.user.username}, who joined on ${joinedAt}!`
    );
  },
};

export default command;
