export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string;
          email: string;
          display_name: string;
          photo_url: string | null;
          role: 'super_admin' | 'admin' | 'member';
          status: 'active' | 'suspended' | 'banned';
          current_streak: number;
          longest_streak: number;
          last_login_date: string | null;
          last_seen: string | null;
          favorite_clubs: string[];
          favorite_players: (string | number)[];
          booked_tickets: Record<string, unknown>;
          penalty_best: number;
          super_over_best: number;
          survey_interests: Record<string, unknown> | null;
          survey_completed: boolean;
          survey_skipped: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          email: string;
          display_name?: string;
          photo_url?: string | null;
          role?: 'super_admin' | 'admin' | 'member';
          status?: 'active' | 'suspended' | 'banned';
          current_streak?: number;
          longest_streak?: number;
          last_login_date?: string | null;
          last_seen?: string | null;
          favorite_clubs?: string[];
          favorite_players?: (string | number)[];
          booked_tickets?: Record<string, unknown>;
          penalty_best?: number;
          super_over_best?: number;
          survey_interests?: Record<string, unknown> | null;
          survey_completed?: boolean;
          survey_skipped?: boolean;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          read: boolean;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string;
          title: string;
          body?: string;
          read?: boolean;
          payload?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      app_config: {
        Row: {
          id: string;
          feature_flags: Record<string, unknown>[];
          sa_admins: Record<string, unknown>[];
          permissions: Record<string, unknown>[];
          maintenance: boolean;
          health: Record<string, unknown>;
          audit_log: Record<string, unknown>[];
          enabled_sports: Record<string, boolean>;
          super_admin_emails: Record<string, boolean>;
          updated_at: string;
        };
        Insert: {
          id?: string;
          feature_flags?: Record<string, unknown>[];
          sa_admins?: Record<string, unknown>[];
          permissions?: Record<string, unknown>[];
          maintenance?: boolean;
          health?: Record<string, unknown>;
          audit_log?: Record<string, unknown>[];
          enabled_sports?: Record<string, boolean>;
          super_admin_emails?: Record<string, boolean>;
        };
        Update: Partial<Database['public']['Tables']['app_config']['Insert']>;
      };
      login_logs: {
        Row: {
          id: string;
          user_auth_id: string | null;
          email: string;
          display_name: string;
          role: string;
          logged_at: string;
        };
        Insert: {
          id?: string;
          user_auth_id?: string | null;
          email?: string;
          display_name?: string;
          role?: string;
        };
        Update: Partial<Database['public']['Tables']['login_logs']['Insert']>;
      };
    };
  };
}
