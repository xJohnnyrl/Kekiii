import { GuildMember } from "discord.js";
import db from "@/utils/database";

/**
 * Ensures a user exists in the database, creating records if they don't.
 * @param member The Discord guild member
 * @returns Promise that resolves when the check/creation is complete
 */
export async function ensureUserExists(member: GuildMember): Promise<void> {
  if (!member) return;

  const id = member.id;
  const username = member.user.username;
  const joinedAt = member.joinedAt
    ? member.joinedAt.toISOString()
    : new Date().toISOString();
  const avatarUrl = member.user.displayAvatarURL({ size: 256 });

  try {
    // Check if user exists
    const existingUser = await db.get(
      `SELECT user_id FROM users WHERE user_id = $id`,
      { $id: id }
    );

    // If user doesn't exist, create them
    if (!existingUser) {
      // Insert user with joined_at date
      await db.run(
        `INSERT INTO users (user_id, username, joined_at) VALUES ($id, $username, $joinedAt)`,
        {
          $id: id,
          $username: username,
          $joinedAt: joinedAt,
        }
      );

      // Create profile with default values and avatar URL
      await db.run(
        `INSERT INTO profiles (user_id, level, xp, profile_picture, total_voice_time) VALUES ($id, 1, 0, $avatarUrl, 0)`,
        {
          $id: id,
          $avatarUrl: avatarUrl,
        }
      );

      console.log("User and profile added to the database:", username);
    }
  } catch (err) {
    console.error("Error ensuring user exists:", err);
  }
}
