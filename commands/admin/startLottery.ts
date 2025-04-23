import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import db from "@/utils/database";
import type Command from "@/interfaces/slashCommand";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("startlottery")
    .setDescription("Start a new lottery.")
    .addIntegerOption((option) =>
      option
        .setName("prize_amount")
        .setDescription("The amount of the prize")
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption((option) =>
      option
        .setName("prize_type")
        .setDescription("The type of currency for the prize")
        .setRequired(true)
        .addChoices(
          { name: "Konpeito Stars", value: "konpeito" },
          { name: "Sugar Cubes", value: "sugar_cubes" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("duration_days")
        .setDescription("Duration of the lottery in days")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(30)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ) as SlashCommandBuilder,
  async execute(interaction: CommandInteraction) {
    const prizeAmount = interaction.options.get("prize_amount")
      ?.value as number;
    const prizeType = interaction.options.get("prize_type")?.value as
      | "konpeito"
      | "sugar_cubes";
    const durationDays = interaction.options.get("duration_days")
      ?.value as number;

    try {
      // Calculate end time
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + durationDays);

      // Create new lottery
      await db.run(
        `INSERT INTO lotteries (prize_amount, prize_type, end_time) 
         VALUES ($amount, $type, $endTime)`,
        {
          $amount: prizeAmount,
          $type: prizeType,
          $endTime: endTime.toISOString(),
        }
      );

      const embed = new EmbedBuilder()
        .setColor("#F77677")
        .setTitle("｡°⊹ ☆. New Lottery Started!")
        .setDescription("───────────────────────────── ･ ｡ﾟ")
        .addFields(
          {
            name: "┊ ʚ  🎟️ **Prize**",
            value: ` ╰  ${prizeAmount} ${
              prizeType === "konpeito"
                ? "Konpeito Stars <a:1317224873939959879:1359669945079828610>"
                : "Sugar Cubes <a:1317229194106638406:1359669930936762398>"
            }`,
          },
          {
            name: "┊ ʚ  ⏱️ **Duration**",
            value: ` ╰  ${durationDays} days`,
          },
          {
            name: "┊ ʚ  📅 **Ends**",
            value: ` ╰  <t:${Math.floor(endTime.getTime() / 1000)}:F>`,
          }
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error starting lottery:", error);
      await interaction.reply({
        content: "An error occurred while starting the lottery.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
