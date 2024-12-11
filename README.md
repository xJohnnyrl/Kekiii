# 🎂 Kekiii - Discord Bot 🎂

Welcome to **Kekiii**, a cute and powerful Discord bot that helps you manage your server with ease. Built with love and designed with a little sprinkle of magic, Kekiii is here to assist you with fun commands and useful features. Ready to get started? Follow the instructions below! ✨

![cake-eyes](public/img/1500x500.jpg)

---

## 📚 Table of Contents

1. [Requirements](#-requirements)
2. [Running Locally (using Bun)](#-running-locally-using-bun)
3. [Using Docker (Optional)](#-using-docker-optional)
4. [Contributing](#-contributing)
5. [Resources](#-resources)
6. [License](#-license)

---

## 📋 Requirements

Before running **Kekiii**, make sure you have the following:

- **[Bun](https://bun.sh/)** (for local development, highly recommended) 🍞
- **[Docker](https://www.docker.com/)** (optional, for containerized deployment) 🐳
- A **Discord bot token**, **client ID**, and **guild ID** (you’ll need to create a Discord bot and add it to your server) 👑

---

## 🏃 Running Locally (using Bun)

Follow these steps to run **Kekiii** locally:

### 1. Clone the repository

Clone the repository to your local machine:

```bash
git clone https://github.com/xJohnnyrl/Kekiii.git
```

### 2. Install dependencies

Use **Bun** to install the necessary dependencies:

```bash
bun install
```

### 3. Set up environment variables

Create a `.env` file in the root directory of the project and add the following environment variables:

```env
DISCORD_TOKEN=your_discord_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id
```

Replace `your_discord_token`, `your_client_id`, and `your_guild_id` with your actual Discord bot credentials. 🌟

### 4. Start the bot

Run **Kekiii** with **Bun**:

```bash
bun run bot.ts
```

---

## 🐳 Using Docker (Optional)

If you prefer running **Kekiii** in a Docker container, follow these steps:

### 1. Build the Docker image

Build the Docker image for **Kekiii**:

```bash
docker build -t discord-bot .
```

### 2. Run the Docker container

Run the container with your environment variables:

```bash
docker run -d --name discord-bot \
  -e DISCORD_TOKEN=your_discord_token \
  -e CLIENT_ID=your_client_id \
  -e GUILD_ID=your_guild_id \
  discord-bot
```

Be sure to replace the environment variables with your own Discord bot credentials. 🦄

---

## 🤝 Contributing

We’d love for you to contribute! Whether you’ve got a new feature idea, bug fix, or just want to say hello, feel free to open an issue or submit a pull request on our [GitHub repository](https://github.com/xJohnnyrl/Kekiii/issues). 🎉

---

## 📚 Resources

If you're new to Discord bot development or want to learn more, here are some helpful resources:

- [Discord.js Documentation](https://discord.js.org/#/docs/main/stable/general/welcome) 📜
- [Discord API Documentation](https://discord.com/developers/docs/intro) 🔥
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 💻
- [Node.js Documentation](https://nodejs.org/en/docs/) 🌱

---

## 📜 License

This project is licensed under the [Apache 2.0 License](LICENSE). ✨

---
