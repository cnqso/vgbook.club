export interface Club {
  id: number;
  name: string;
  description?: string;
  secret_passcode: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  club_id: number;
  username: string;
  password?: string;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: number;
  user_id: number;
  igdb_id: number;
  title: string;
  cover_url?: string;
  release_date?: number;
  status: 'unplayed' | 'playing' | 'played';
  date_added: string;
  date_started?: string;
  date_finished?: string;
  position_in_queue: number;
}

export interface Rotation {
  id: number;
  club_id: number;
  name: string;
  status: 'active' | 'completed' | 'planned';
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface RotationGame {
  id: number;
  rotation_id: number;
  game_id: number;
  rotation_status: 'unplayed' | 'playing' | 'played';
  date_started?: string;
  date_finished?: string;
  play_order: number;
}

export interface GameWithUser extends Game {
  username: string;
  cover_url?: string;
}

export interface RotationGameWithDetails extends RotationGame {
  title: string;
  username: string;
  cover_url?: string;
  release_date?: number;
  igdb_id: number;
}

export interface ActiveRotation {
  id: number;
  name: string;
  created_at: string;
  total_rotation_games: number;
  games?: RotationGameWithDetails[];
}
