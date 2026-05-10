export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          role: "student" | "pro" | "admin";
          daily_goal_ms: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "student" | "pro" | "admin";
          daily_goal_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "student" | "pro" | "admin";
          daily_goal_ms?: number | null;
          created_at?: string;
        };
      };
      practice_logs: {
        Row: {
          id: string;
          user_id: string;
          duration: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          duration: number;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          duration?: number;
          date?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type PracticeLog = Database["public"]["Tables"]["practice_logs"]["Row"];
