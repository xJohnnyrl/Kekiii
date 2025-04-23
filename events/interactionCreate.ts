import { Events, type Interaction, Collection } from "discord.js";
import ExtendedClient from "@/interfaces/client";

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    // Cast the interaction.client to ExtendedClient
    const command = (interaction.client as ExtendedClient).commands.get(
      interaction.commandName
    );

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    // Handle cooldowns
    const { cooldowns } = interaction.client as ExtendedClient;

    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldown = 3;
    const cooldownAmount = (command.cooldown || defaultCooldown) * 1_000;

    if (timestamps && timestamps.has(interaction.user.id)) {
      const expirationTime =
        (timestamps.get(interaction.user.id) || 0) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return interaction.reply({
          content: `Please wait ${timeLeft.toFixed(
            1
          )} more second(s) before reusing the \`${
            command.data.name
          }\` command.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Set cooldown timestamp after executing the command
    timestamps?.set(interaction.user.id, now);
    setTimeout(() => timestamps?.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
