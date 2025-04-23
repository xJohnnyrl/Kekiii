import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} from "discord.js";
import db from "@/utils/database";
import type Command from "@/interfaces/slashCommand";

type LeaderboardType = "level" | "konpeito" | "sugar_cubes";

const ITEMS_PER_PAGE = 10;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Display the server leaderboard.")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The type of leaderboard to display")
        .setRequired(true)
        .addChoices(
          { name: "Level", value: "level" },
          { name: "Konpeito Stars", value: "konpeito" },
          { name: "Sugar Cubes", value: "sugar_cubes" }
        )
    ) as SlashCommandBuilder,
  async execute(interaction: CommandInteraction) {
    const type = interaction.options.get("type")?.value as LeaderboardType;

    try {
      let query = "";
      let title = "";
      let valueFormatter = (value: number) => value.toString();

      switch (type) {
        case "level":
          query = `
            SELECT u.username, p.level, p.xp
            FROM profiles p
            JOIN users u ON p.user_id = u.user_id
            ORDER BY p.level DESC, p.xp DESC
          `;
          title = "Level Leaderboard";
          valueFormatter = (value: number) => `Level ${value}`;
          break;
        case "konpeito":
          query = `
            SELECT u.username, p.balance_konpeito as value
            FROM profiles p
            JOIN users u ON p.user_id = u.user_id
            ORDER BY p.balance_konpeito DESC
          `;
          title = "Konpeito Stars Leaderboard";
          valueFormatter = (value: number) =>
            `${value} <a:konpeito:1317224873939959879>`;
          break;
        case "sugar_cubes":
          query = `
            SELECT u.username, p.balance_sugar_cubes as value
            FROM profiles p
            JOIN users u ON p.user_id = u.user_id
            ORDER BY p.balance_sugar_cubes DESC
          `;
          title = "Sugar Cubes Leaderboard";
          valueFormatter = (value: number) =>
            `${value} <a:sugarcube:1317229194106638406>`;
          break;
      }

      const leaderboardData = await db.all<{
        username: string;
        value: number;
        level?: number;
        xp?: number;
      }>(query);

      if (!leaderboardData || leaderboardData.length === 0) {
        await interaction.reply({
          content: "No data available for the leaderboard yet!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      let currentPage = 0;
      const totalPages = Math.ceil(leaderboardData.length / ITEMS_PER_PAGE);

      const createEmbed = (page: number) => {
        const start = page * ITEMS_PER_PAGE;
        const end = Math.min(start + ITEMS_PER_PAGE, leaderboardData.length);
        const pageData = leaderboardData.slice(start, end);

        const embed = new EmbedBuilder()
          .setColor("#F77677")
          .setTitle(`｡°⊹ ☆. ${title}`)
          .setDescription("───────────────────────────── ･ ｡ﾟ")
          .setFooter({ text: `Page ${page + 1}/${totalPages}` });

        // Create leaderboard entries
        const leaderboardEntries = pageData.map((entry, index) => {
          const globalIndex = start + index;
          const medal =
            globalIndex === 0
              ? "🥇"
              : globalIndex === 1
              ? "🥈"
              : globalIndex === 2
              ? "🥉"
              : "▫️";
          const value =
            type === "level"
              ? `${valueFormatter(entry.level || 0)} (${entry.xp || 0} XP)`
              : valueFormatter(entry.value);
          return `${medal} **${globalIndex + 1}.** ${
            entry.username
          }\n ╰  ${value}`;
        });

        embed.addFields({
          name: `┊ ʚ  📊 **Top ${leaderboardData.length}**`,
          value: leaderboardEntries.join("\n\n"),
        });

        return embed;
      };

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("first")
          .setLabel("First")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages - 1),
        new ButtonBuilder()
          .setCustomId("last")
          .setLabel("Last")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages - 1)
      );

      const response = await interaction.reply({
        embeds: [createEmbed(currentPage)],
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

        switch (i.customId) {
          case "first":
            currentPage = 0;
            break;
          case "prev":
            currentPage = Math.max(0, currentPage - 1);
            break;
          case "next":
            currentPage = Math.min(totalPages - 1, currentPage + 1);
            break;
          case "last":
            currentPage = totalPages - 1;
            break;
        }

        const updatedButtons =
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("first")
              .setLabel("First")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === 0),
            new ButtonBuilder()
              .setCustomId("prev")
              .setLabel("Previous")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === 0),
            new ButtonBuilder()
              .setCustomId("next")
              .setLabel("Next")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === totalPages - 1),
            new ButtonBuilder()
              .setCustomId("last")
              .setLabel("Last")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === totalPages - 1)
          );

        await i.update({
          embeds: [createEmbed(currentPage)],
          components: [updatedButtons],
        });
      });

      collector.on("end", async () => {
        const disabledButtons =
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("first")
              .setLabel("First")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("prev")
              .setLabel("Previous")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("next")
              .setLabel("Next")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("last")
              .setLabel("Last")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true)
          );

        await interaction.editReply({
          components: [disabledButtons],
        });
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      await interaction.reply({
        content: "An error occurred while fetching the leaderboard.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
