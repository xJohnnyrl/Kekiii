export interface Users {
  user_id: string;
  username: string;
  joined_at: string | null;
  created_at: string;
}

export interface Profiles {
  user_id: string;
  level: number;
  balance_konpeito: number;
  balance_sugar_cubes: number;
  xp: number;
  profile_picture: string;
  total_voice_time: number;
}

export interface DailyClaims {
  user_id: string;
  streak: number;
  last_claim: string;
}

export interface Items {
  item_id: number;
  name: string;
  catchphrase: string;
  description: string;
  price_sugar: number;
  price_konpeito: number;
  category: string;
  rarity: string;
  is_sellable: boolean;
  image_url: string;
}

export interface Lottery {
  lottery_id: number;
  prize_amount: number;
  prize_type: "konpeito" | "sugar_cubes";
  start_time: string;
  end_time: string;
  status: "active" | "completed" | "cancelled";
  winner_id: string | null;
}

export interface LotteryEntry {
  entry_id: number;
  lottery_id: number;
  user_id: string;
  entry_time: string;
}

// Base callback types
export interface Database {
  get(
    sql: string,
    params: any,
    callback: (err: Error | null, row: any) => void
  ): void;
  get(sql: string, callback: (err: Error | null, row: any) => void): void;
  run(sql: string, params: any, callback: (err: Error | null) => void): void;
  run(sql: string, callback: (err: Error | null) => void): void;
}

// Async wrapper types
export interface AsyncDatabase {
  get<T>(sql: string, params?: any): Promise<T>;
  all<T>(sql: string, params?: any): Promise<T[]>;
  run(sql: string, params?: any): Promise<void>;
}
