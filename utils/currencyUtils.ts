import db from "@/utils/database";

/**
 * Updates the currency of a user based on the amount provided
 * @param userId The Discord user ID
 * @param type 'Konpeito' | 'sugar_cubes'
 * @param amount The amount of currency to give
 * @returns Updated balance
 */
export async function giveCurrency(
  userId: string,
  type: "konpeito" | "sugar_cubes",
  amount: number
) {
  await db.run(
    `INSERT INTO currency (user_id, type, amount, updated_at)
       VALUES (?, ?, ?, datetime('now'))`,
    [userId, type, amount]
  );

  const column =
    type === "konpeito" ? "balance_konpeito" : "balance_sugar_cubes";
  await db.run(
    `UPDATE profiles
       SET ${column} = ${column} + ?
       WHERE user_id = ?`,
    [amount, userId]
  );

  const row = await db.get<{ [key: string]: number }>(
    `SELECT ${column} FROM profiles WHERE user_id = ?`,
    [userId]
  );

  return row?.[column] ?? 0;
}
