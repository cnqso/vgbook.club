import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    
    const [statsRows] = await db.execute(`
      SELECT 
        COUNT(DISTINCT u.id) as total_members,
        COUNT(DISTINCT g.id) as total_games,
        COUNT(DISTINCT CASE WHEN g.status = 'played' THEN g.id END) as completed_games,
        COUNT(DISTINCT CASE WHEN g.status = 'playing' THEN g.id END) as playing_games
      FROM users u
      LEFT JOIN games g ON u.id = g.user_id
      WHERE u.club_id = ?
    `, [user.clubId]);

    const stats = (statsRows as { 
      total_members: number; 
      total_games: number; 
      completed_games: number; 
      playing_games: number; 
    }[])[0];

    
    const [rotationRows] = await db.execute(`
      SELECT r.id, r.name, r.created_at, COUNT(rg.id) as total_rotation_games
      FROM rotations r
      LEFT JOIN rotation_games rg ON r.id = rg.rotation_id
      WHERE r.club_id = ? AND r.status = 'active'
      GROUP BY r.id, r.name, r.created_at
    `, [user.clubId]);

    const activeRotation = (rotationRows as { 
      id: number; 
      name: string; 
      created_at: string; 
      total_rotation_games: number; 
    }[])[0] || null;

    
    let activeRotationGames: RowDataPacket[] = [];
    if (activeRotation) {
      const [rotationGamesRows] = await db.execute(`
        SELECT
          rg.id,
          rg.rotation_status,
          rg.play_order,
          g.title,
          g.cover_url,
          g.release_date,
          g.igdb_id,
          u.username
        FROM rotation_games rg
        JOIN games g ON rg.game_id = g.id
        JOIN users u ON g.user_id = u.id
        WHERE rg.rotation_id = ?
        ORDER BY rg.play_order ASC
      `, [activeRotation.id]);

      activeRotationGames = rotationGamesRows as RowDataPacket[];
    }

    
    const [currentGameRows] = await db.execute(`
      SELECT 
        g.id,
        g.title,
        g.cover_url,
        g.release_date,
        g.date_started,
        g.igdb_id,
        u.username
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE u.club_id = ? AND g.status = 'playing'
      LIMIT 1
    `, [user.clubId]);

    const currentGame = (currentGameRows as { 
      id: number; 
      title: string; 
      cover_url?: string; 
      release_date?: number; 
      date_started: string; 
      igdb_id: number; 
      username: string; 
    }[])[0] || null;

    
    const [recentActivityRows] = await db.execute(`
      SELECT 
        g.title,
        g.cover_url,
        g.release_date,
        g.date_finished,
        u.username
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE u.club_id = ? AND g.status = 'played' AND g.date_finished IS NOT NULL
      ORDER BY g.date_finished DESC
      LIMIT 5
    `, [user.clubId]);

    const recentActivity = recentActivityRows as { 
      title: string; 
      cover_url?: string; 
      release_date?: number; 
      date_finished: string; 
      username: string; 
    }[];

    return NextResponse.json({
      success: true,
      stats: {
        totalMembers: stats.total_members,
        totalGames: stats.total_games,
        completedGames: stats.completed_games,
        playingGames: stats.playing_games,
        inProgressGames: stats.total_games - stats.completed_games,
      },
      activeRotation: activeRotation ? {
        ...activeRotation,
        games: activeRotationGames,
      } : null,
      currentGame,
      recentActivity,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
