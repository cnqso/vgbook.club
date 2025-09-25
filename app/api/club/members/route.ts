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

    const [rows] = await db.execute(`
      SELECT 
        u.id,
        u.username,
        u.is_owner,
        u.created_at,
        COUNT(DISTINCT g.id) as total_games,
        COUNT(DISTINCT CASE WHEN g.status = 'played' THEN g.id END) as completed_games,
        COUNT(DISTINCT CASE WHEN g.status = 'playing' THEN g.id END) as playing_games,
        COUNT(DISTINCT CASE WHEN g.status = 'unplayed' THEN g.id END) as queued_games
      FROM users u
      LEFT JOIN games g ON u.id = g.user_id
      WHERE u.club_id = ?
      GROUP BY u.id, u.username, u.is_owner, u.created_at
      ORDER BY u.is_owner DESC, u.created_at ASC
    `, [user.clubId]);

    const members = (rows as RowDataPacket[]).map(member => ({
      id: member.id,
      username: member.username,
      is_owner: member.is_owner,
      created_at: member.created_at,
      gameCount: member.total_games,
      completedCount: member.completed_games,
      playingCount: member.playing_games,
      queuedCount: member.queued_games,
    }));

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error('Get club members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
