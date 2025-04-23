import { GuildMember } from "discord.js";

const LEVEL_ROLES = {
  1: "1340373113598382162", // Emojis role
  3: "1340373051648245870", // File/pic upload role
  10: "1340370104197840926", // Embed role
};

/**
 * Assigns roles to a member based on their level
 * @param member The Discord guild member
 * @param level The member's current level
 */
export async function assignLevelRoles(
  member: GuildMember,
  level: number
): Promise<void> {
  try {
    // Get all roles that should be assigned based on the level
    const rolesToAssign = Object.entries(LEVEL_ROLES)
      .filter(([threshold]) => level >= parseInt(threshold))
      .map(([, roleId]) => roleId);

    // Get current roles
    const currentRoles = member.roles.cache.map((role) => role.id);

    // Add missing roles
    for (const roleId of rolesToAssign) {
      if (!currentRoles.includes(roleId)) {
        await member.roles.add(roleId);
      }
    }
  } catch (error) {
    console.error("Error assigning level roles:", error);
  }
}
