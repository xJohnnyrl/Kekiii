import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import type Command from "@/interfaces/slashCommand";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Provides information about the server."),
  async execute(interaction: CommandInteraction) {
    await interaction.reply(
      `This command was run by ${interaction.guild?.name}, who has ${interaction.guild?.memberCount}! members`
    );
  },
};

export default command;
