import { Client, Events, GatewayIntentBits, Collection } from "discord.js";
import ExtendedClient from "@/interfaces/client";

if (
  !process.env.DISCORD_TOKEN ||
  !process.env.CLIENT_ID ||
  !process.env.GUILD_ID
) {
  throw new Error(
    "Missing required environment variables: DISCORD_TOKEN, CLIENT_ID"
  );
}

const { DISCORD_TOKEN } = process.env;

const client = new ExtendedClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

try {
  await client.login(DISCORD_TOKEN);
} catch (error) {
  console.error("Failed to log in to Discord:", error);
  process.exit(1);
}
