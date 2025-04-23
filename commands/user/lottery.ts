import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  MessageFlags,
} from "discord.js";
import db from "@/utils/database";
import type Command from "@/interfaces/slashCommand";
import type { Lottery } from "@/interfaces/database";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("lottery")
    .setDescription(
      "Participate in the current lottery."
    ) as SlashCommandBuilder,
  async execute(interaction: CommandInteraction) {
    try {
      // Get active lottery
      const activeLottery = await db.get<Lottery>(
        `SELECT * FROM lotteries WHERE status = 'active' ORDER BY end_time ASC LIMIT 1`
      );

      if (!activeLottery) {
        await interaction.reply({
          content: "There is no active lottery at the moment.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Get total entries
      const totalEntries = await db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM lottery_entries 
         WHERE lottery_id = $lotteryId`,
        {
          $lotteryId: activeLottery.lottery_id,
        }
      );

      const embed = new EmbedBuilder()
        .setColor("#F77677")
        .setTitle("｡°⊹ ☆. Welcome to Kekiii's Lottery")
        .addFields(
          {
            name: "┊ ʚ  🎟️ **Prize**",
            value: ` ╰  ${activeLottery.prize_amount} ${
              activeLottery.prize_type === "konpeito"
                ? "Konpeito Stars <a:1317224873939959879:1359669945079828610>"
                : "Sugar Cubes <a:1317229194106638406:1359669930936762398>"
            }`,
          },
          {
            name: "┊ ʚ  ⏱️ **Time Remaining**",
            value: ` ╰  <t:${Math.floor(
              new Date(activeLottery.end_time).getTime() / 1000
            )}:R>`,
          },
          {
            name: "┊ ʚ  👥 **Total Entries**",
            value: ` ╰  ${totalEntries?.count || 0}`,
          }
        );

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("enter_lottery")
          .setLabel("Enter Lottery")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🎲")
      );

      const response = await interaction.reply({
        embeds: [embed],
        components: [buttons],
        withResponse: true,
      });

      const collector =
        response.resource!.message!.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 300000, // 5 minutes
        });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: "You can't use these buttons!",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        try {
          // Check if user already has an entry
          const existingEntry = await db.get<{ count: number }>(
            `SELECT COUNT(*) as count FROM lottery_entries 
             WHERE lottery_id = $lotteryId AND user_id = $userId`,
            {
              $lotteryId: activeLottery.lottery_id,
              $userId: interaction.user.id,
            }
          );

          if (existingEntry && existingEntry.count > 0) {
            await i.reply({
              content: "You already have an entry in this lottery!",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          // Create entry
          await db.run(
            `INSERT INTO lottery_entries (lottery_id, user_id) 
             VALUES ($lotteryId, $userId)`,
            {
              $lotteryId: activeLottery.lottery_id,
              $userId: interaction.user.id,
            }
          );

          await i.reply({
            content: "You've successfully entered the lottery! Good luck!",
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error("Error processing lottery action:", error);
          await i.reply({
            content: "An error occurred while processing your action.",
            ephemeral: true,
          });
        }
      });

      collector.on("end", async () => {
        const disabledButtons =
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("enter_lottery")
              .setLabel("Enter Lottery")
              .setStyle(ButtonStyle.Success)
              .setEmoji("🎲")
              .setDisabled(true)
          );

        await interaction.editReply({
          components: [disabledButtons],
        });
      });
    } catch (error) {
      console.error("Error in lottery command:", error);
      await interaction.reply({
        content: "An error occurred while processing the lottery command.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
