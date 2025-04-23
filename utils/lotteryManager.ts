import { Client, TextChannel } from "discord.js";
import db from "@/utils/database";
import type { Lottery, LotteryEntry } from "@/interfaces/database";

export class LotteryManager {
  private client: Client;
  private checkInterval: NodeJS.Timeout;

  constructor(client: Client) {
    this.client = client;
    this.checkInterval = setInterval(() => this.checkLotteries(), 60000); // Check every minute
  }

  private async checkLotteries() {
    try {
      // Get all active lotteries that have ended
      const endedLotteries = await db.all<Lottery[]>(
        `SELECT * FROM lotteries 
         WHERE status = 'active' 
         AND end_time <= datetime('now')`
      );

      for (const lottery of endedLotteries) {
        await this.endLottery(lottery);
      }
    } catch (error) {
      console.error("Error checking lotteries:", error);
    }
  }

  private async endLottery(lottery: Lottery) {
    try {
      // Get all entries for this lottery
      const entries = await db.all<LotteryEntry[]>(
        `SELECT * FROM lottery_entries 
         WHERE lottery_id = $lotteryId`,
        { $lotteryId: lottery.lottery_id }
      );

      if (entries.length === 0) {
        // No entries, mark as completed without winner
        await db.run(
          `UPDATE lotteries 
           SET status = 'completed' 
           WHERE lottery_id = $lotteryId`,
          { $lotteryId: lottery.lottery_id }
        );
        return;
      }

      // Select random winner
      const winnerEntry = entries[Math.floor(Math.random() * entries.length)];

      // Update lottery with winner
      await db.run(
        `UPDATE lotteries 
         SET status = 'completed', winner_id = $winnerId 
         WHERE lottery_id = $lotteryId`,
        {
          $lotteryId: lottery.lottery_id,
          $winnerId: winnerEntry.user_id,
        }
      );

      // Award prize to winner
      if (lottery.prize_type === "konpeito") {
        await db.run(
          `UPDATE profiles 
           SET balance_konpeito = balance_konpeito + $amount 
           WHERE user_id = $userId`,
          {
            $amount: lottery.prize_amount,
            $userId: winnerEntry.user_id,
          }
        );
      } else {
        await db.run(
          `UPDATE profiles 
           SET balance_sugar_cubes = balance_sugar_cubes + $amount 
           WHERE user_id = $userId`,
          {
            $amount: lottery.prize_amount,
            $userId: winnerEntry.user_id,
          }
        );
      }

      // Announce winner
      const channel = await this.client.channels.fetch(
        "YOUR_ANNOUNCEMENT_CHANNEL_ID"
      );
      if (channel instanceof TextChannel) {
        const winnerUser = await this.client.users.fetch(winnerEntry.user_id);
        const embed = {
          color: 0xf77677,
          title: "｡°⊹ ☆. Lottery Winner!",
          description: "───────────────────────────── ･ ｡ﾟ",
          fields: [
            {
              name: "┊ ʚ  🎉 **Winner**",
              value: ` ╰  ${winnerUser.tag}`,
            },
            {
              name: "┊ ʚ  🎁 **Prize**",
              value: ` ╰  ${lottery.prize_amount} ${
                lottery.prize_type === "konpeito"
                  ? "Konpeito Stars <a:1317224873939959879:1359669945079828610>"
                  : "Sugar Cubes <a:1317229194106638406:1359669930936762398>"
              }`,
            },
          ],
        };

        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error ending lottery:", error);
    }
  }

  public destroy() {
    clearInterval(this.checkInterval);
  }
}
