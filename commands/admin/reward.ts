import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import db from "@/utils/database";
import type Command from "@/interfaces/slashCommand";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("reward")
    .setDescription("Give currency to a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to reward")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The type of currency to give")
        .setRequired(true)
        .addChoices(
          { name: "Konpeito Stars", value: "konpeito" },
          { name: "Sugar Cubes", value: "sugar_cubes" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to give")
        .setRequired(true)
        .setMinValue(1)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ) as SlashCommandBuilder,

  async execute(interaction: CommandInteraction) {
    const targetUser = interaction.options.get("user")?.user;
    const rewardType = interaction.options.get("type")?.value as
      | "konpeito"
      | "sugar_cubes";
    const amount = interaction.options.get("amount")?.value as number;

    if (!targetUser) {
      await interaction.reply({
        content: "Failed to find the specified user.",
        ephemeral: true,
      });
      return;
    }

    try {
      // Check if user exists in profiles table
      const userProfile = await db.get(
        `SELECT * FROM profiles WHERE user_id = $userId`,
        { $userId: targetUser.id }
      );

      if (!userProfile) {
        // Create user profile if it doesn't exist
        await db.run(
          `INSERT INTO users (user_id, username) VALUES ($userId, $username)`,
          {
            $userId: targetUser.id,
            $username: targetUser.username,
          }
        );

        await db.run(`INSERT INTO profiles (user_id) VALUES ($userId)`, {
          $userId: targetUser.id,
        });
      }

      // Update the user's balance
      const balanceColumn =
        rewardType === "konpeito" ? "balance_konpeito" : "balance_sugar_cubes";
      await db.run(
        `UPDATE profiles 
         SET ${balanceColumn} = ${balanceColumn} + $amount 
         WHERE user_id = $userId`,
        {
          $amount: amount,
          $userId: targetUser.id,
        }
      );

      const embed = new EmbedBuilder()
        .setColor("#F77677")
        .setTitle("｡°⊹ ☆. Reward Given!")
        .setDescription("───────────────────────────── ･ ｡ﾟ")
        .addFields(
          {
            name: "┊ ʚ  👤 **Recipient**",
            value: ` ╰  ${targetUser.tag}`,
          },
          {
            name: "┊ ʚ  🎁 **Reward**",
            value: ` ╰  ${amount} ${
              rewardType === "konpeito"
                ? "Konpeito Stars <a:konpeito:1317224873939959879>"
                : "Sugar Cubes <a:sugarcube:1317229194106638406>"
            }`,
          }
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error giving reward:", error);
      await interaction.reply({
        content: "An error occurred while giving the reward.",
        ephemeral: true,
      });
    }
  },
};

export default command;
