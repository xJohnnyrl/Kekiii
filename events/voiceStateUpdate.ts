import { Events, VoiceState } from "discord.js";
import db from "@/utils/database";
import { ensureUserExists } from "@/utils/userUtils";
import { processXpGain } from "@/utils/levelUtils";

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    if (oldState.member?.user.bot || newState.member?.user.bot) return;

    // User joined a voice channel
    if (!oldState.channelId && newState.channelId) {
      await handleVoiceJoin(newState);
    }

    // User left a voice channel
    else if (oldState.channelId && !newState.channelId) {
      await handleVoiceLeave(oldState);
    }

    // User switched channels
    else if (
      oldState.channelId &&
      newState.channelId &&
      oldState.channelId !== newState.channelId
    ) {
      await handleVoiceLeave(oldState);
      await handleVoiceJoin(newState);
    }
  },
};

/**
 * Handles when a user joins a voice channel
 */
async function handleVoiceJoin(state: VoiceState) {
  const userId = state.member?.id;
  if (!userId) return;

  await ensureUserExists(state.member!);

  try {
    const existingSession = await db.get<{ user_id: string }>(
      `SELECT user_id FROM voice_sessions WHERE user_id = $userId`,
      { $userId: userId }
    );

    if (existingSession) {
      await db.run(
        `UPDATE voice_sessions SET joined_at = $joinedAt WHERE user_id = $userId`,
        {
          $userId: userId,
          $joinedAt: new Date().toISOString(),
        }
      );
    } else {
      await db.run(
        `INSERT INTO voice_sessions (user_id, joined_at) VALUES ($userId, $joinedAt)`,
        {
          $userId: userId,
          $joinedAt: new Date().toISOString(),
        }
      );
    }
  } catch (err) {
    console.error("Error recording voice join:", err);
  }
}

/**
 * Handles when a user leaves a voice channel
 */
async function handleVoiceLeave(state: VoiceState) {
  const userId = state.member?.id;
  if (!userId) return;

  try {
    const session = await db.get<{ joined_at: string }>(
      `SELECT joined_at FROM voice_sessions WHERE user_id = $userId`,
      { $userId: userId }
    );

    if (!session) {
      console.log(
        `No voice session found for user ${state.member?.user.username}`
      );
      return;
    }

    // Calculate duration in minutes
    const joinTime = new Date(session.joined_at);
    const leaveTime = new Date();
    const durationMs = leaveTime.getTime() - joinTime.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));

    const xpGain = durationMinutes * 2;

    if (xpGain > 0) {
      const result = await processXpGain(userId, xpGain, state.member);
    }

    await db.run(
      `UPDATE profiles SET total_voice_time = total_voice_time + $duration WHERE user_id = $userId`,
      {
        $userId: userId,
        $duration: durationMinutes,
      }
    );

    await db.run(`DELETE FROM voice_sessions WHERE user_id = $userId`, {
      $userId: userId,
    });
  } catch (err) {
    console.error("Error processing voice leave:", err);
  }
}
