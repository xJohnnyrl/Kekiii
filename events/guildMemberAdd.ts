import { Events, GuildMember } from "discord.js";
import db from "@/utils/database";

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const id = member.id;
    const username = member.user.username;
    const joinedAt = member.joinedAt
      ? member.joinedAt.toISOString()
      : new Date().toISOString();
    const avatarUrl = member.user.displayAvatarURL({ size: 256 });

    try {
      const existingUser = await db.get(
        `SELECT user_id FROM users WHERE user_id = $id`,
        { $id: id }
      );

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
      } else {
        console.log("User already exists in the database:", username);
      }
    } catch (err) {
      console.error("Database error:", err);
    }
  },
};
