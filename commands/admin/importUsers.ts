import {
  SlashCommandBuilder,
  CommandInteraction,
  GuildMember,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import db from "@/utils/database";
import type Command from "@/interfaces/slashCommand";
import { ensureUserExists } from "@/utils/userUtils";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("importusers")
    .setDescription("Imports all users from the server into the database.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: CommandInteraction) {
    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: "You need administrator permissions to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    try {
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply(
          "This command can only be used in a server."
        );
        return;
      }

      const members = await guild.members.fetch();
      let importedCount = 0;
      let existingCount = 0;
      let errorCount = 0;

      for (const [, member] of members) {
        try {
          if (member?.user.bot) continue;

          // Check if user exists
          const existingUser = await db.get(
            `SELECT user_id FROM users WHERE user_id = $id`,
            { $id: member.id }
          );

          if (!existingUser) {
            // Import the user
            await ensureUserExists(member);
            importedCount++;
          } else {
            existingCount++;
          }
        } catch (err) {
          console.error(`Error importing user ${member.user.username}:`, err);
          errorCount++;
        }
      }

      await interaction.editReply(
        `Import complete!\n- ${importedCount} users imported\n- ${existingCount} users already in database\n- ${errorCount} errors`
      );
    } catch (err) {
      console.error("Error importing users:", err);
      await interaction.editReply("An error occurred while importing users.");
    }
  },
};

export default command;
