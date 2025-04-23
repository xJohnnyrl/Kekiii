import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import type Command from "@/interfaces/slashCommand";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction: CommandInteraction) {
    await interaction.reply("Pong!");
  },
};

export default command;
