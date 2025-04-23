import { SlashCommandBuilder, CommandInteraction } from "discord.js";

export default interface Command {
  cooldown?: number;
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}
