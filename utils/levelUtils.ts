import { GuildMember } from "discord.js";
import db from "@/utils/database";
import { giveCurrency } from "./currencyUtils";
import { assignLevelRoles } from "./roleUtils";

/**
 * Calculates the XP required for the next level
 * @param currentLevel The current level
 * @returns The XP required for the next level
 */
export function calculateXpRequired(currentLevel: number): number {
  return Math.floor(currentLevel * 100 * 1.25);
}

/**
 * Processes XP gain for a user and handles level ups
 * @param userId The Discord user ID
 * @param xpGain The amount of XP to gain
 * @param member Optional GuildMember object for role assignments
 * @returns An object containing information about the level up
 */
export async function processXpGain(
  userId: string,
  xpGain: number = 2,
  member?: GuildMember
): Promise<{
  didLevelUp: boolean;
  newLevel: number;
  newXp: number;
  xpRequired: number;
}> {
  const profile = await db.get<{ level: number; xp: number }>(
    `SELECT level, xp FROM profiles WHERE user_id = $id`,
    { $id: userId }
  );

  if (!profile) {
    throw new Error(`User profile not found for ID: ${userId}`);
  }

  const newXp = profile.xp + xpGain;

  const xpRequired = calculateXpRequired(profile.level);

  const didLevelUp = newXp >= xpRequired;
  const newLevel = didLevelUp ? profile.level + 1 : profile.level;

  const finalXp = didLevelUp ? 0 : newXp;

  await db.run(
    `UPDATE profiles SET level = $level, xp = $xp WHERE user_id = $id`,
    {
      $id: userId,
      $level: newLevel,
      $xp: finalXp,
    }
  );

  if (didLevelUp) {
    giveCurrency(userId, "konpeito", 100);
    giveCurrency(userId, "sugar_cubes", 1000);

    // Assign roles if member is provided
    if (member) {
      await assignLevelRoles(member, newLevel);
    }
  }

  return {
    didLevelUp,
    newLevel,
    newXp: finalXp,
    xpRequired: didLevelUp ? calculateXpRequired(newLevel) : xpRequired,
  };
}

/**
 * Gets the current level and XP for a user
 * @param userId The Discord user ID
 * @returns The user's level and XP
 */
export async function getUserLevel(userId: string): Promise<{
  level: number;
  xp: number;
  xpRequired: number;
}> {
  const profile = await db.get<{ level: number; xp: number }>(
    `SELECT level, xp FROM profiles WHERE user_id = $id`,
    { $id: userId }
  );

  if (!profile) {
    throw new Error(`User profile not found for ID: ${userId}`);
  }

  return {
    level: profile.level,
    xp: profile.xp,
    xpRequired: calculateXpRequired(profile.level),
  };
}
