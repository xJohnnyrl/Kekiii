import { REST, Routes } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env as {
  DISCORD_TOKEN: string;
  CLIENT_ID: string;
  GUILD_ID: string;
};

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error(
    "DISCORD_TOKEN or CLIENT_ID or GUILD_ID is not set in environment variables."
  );
}

async function registerCommands() {
  const commandsPath = join(__dirname, "./commands");
  const commandFolders = await readdir(commandsPath);
  const commandsArray = [];

  for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = await readdir(folderPath);

    for (const file of commandFiles) {
      if (!file.endsWith(".ts")) continue;

      const commandPath = join(folderPath, file);

      // Dynamically import the command
      const { default: command } = await import(`file://${commandPath}`);
      if ("data" in command && "execute" in command) {
        commandsArray.push(command.data.toJSON());
        console.log(`Loaded command: ${command.data.name}`);
      } else {
        console.warn(`Skipping invalid command file: ${file}`);
      }
    }
  }

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commandsArray,
    });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Failed to refresh application (/) commands:", error);
  }
}

registerCommands().catch(console.error);
