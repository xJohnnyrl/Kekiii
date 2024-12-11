import { Events, Client } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    console.log(`Ready! Logged in as ${client.user?.tag}`);
  },
};
