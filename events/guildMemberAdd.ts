import { Events, GuildMember } from "discord.js";
import db from "@/utils/database";

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const id = member.id;
    const username = member.user.username;

    try {
      const existingUser = await db.get(
        `SELECT user_id FROM users WHERE user_id = $id`,
        { $id: id }
      );

      if (!existingUser) {
        await db.run(
          `INSERT INTO users (user_id, username) VALUES ($id, $username)`,
          {
            $id: id,
            $username: username,
          }
        );
        console.log("User added to the database:", username);
      } else {
        console.log("User already exists in the database:", username);
      }
    } catch (err) {
      console.error("Database error:", err);
    }
  },
};
