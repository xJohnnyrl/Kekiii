export interface Profile {
  user_id: string;
  username: string;
  level: number;
  exp: number;
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
  run(sql: string, params?: any): Promise<void>;
}
