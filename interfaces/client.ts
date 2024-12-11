import { Client, Collection, type ClientOptions } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";

export default class ExtendedClient extends Client {
  public commands: Collection<string, any>;
  public cooldowns: Collection<string, Collection<String, number>>;

  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.loadCommands();
    this.loadEvents();
  }

  async loadCommands() {
    try {
      const commandsPath = join(__dirname, "../commands");
      const commandFolders = await readdir(commandsPath);

      // Loop through each folder in the commands directory
      for (const folder of commandFolders) {
        const folderPath = join(commandsPath, folder);
        const commandFiles = await readdir(folderPath);

        for (const file of commandFiles) {
          if (!file.endsWith(".ts")) continue;

          try {
            const commandPath = join(folderPath, file);

            const { default: command } = await import(`file://${commandPath}`);

            // Check if the command has the required properties
            if ("data" in command && "execute" in command) {
              this.commands.set(command.data.name, command);
              console.log(`Loaded command: ${command.data.name}`);
            } else {
              console.warn(`Skipping invalid command file: ${file}`);
            }
          } catch (error) {
            console.error(`Failed to load command file: ${file}`, error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load commands:", error);
    }
  }

  async loadEvents() {
    try {
      const eventsPath = join(__dirname, "../events");
      const eventFiles = await readdir(eventsPath);

      for (const file of eventFiles) {
        if (!file.endsWith(".ts")) continue;

        try {
          const eventPath = join(eventsPath, file);

          // Dynamically import the event
          const { default: event } = await import(`file://${eventPath}`);

          if (event.name && typeof event.execute === "function") {
            if (event.once) {
              this.once(event.name, async (...args) => {
                try {
                  await event.execute(...args);
                } catch (eventExecuteError) {
                  console.error(
                    `Error executing once event ${event.name}:`,
                    eventExecuteError
                  );
                }
              });
            } else {
              this.on(event.name, async (...args) => {
                try {
                  await event.execute(...args);
                } catch (eventExecuteError) {
                  console.error(
                    `Error executing event ${event.name}:`,
                    eventExecuteError
                  );
                }
              });
            }
            console.log(`Loaded event: ${event.name}`);
          } else {
            console.warn(`Skipping invalid event file: ${file}`);
          }
        } catch (error) {
          console.error(`Failed to load event file: ${file}`, error);
        }
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  }
}
