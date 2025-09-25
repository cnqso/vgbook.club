import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { igdbClient } from '@/lib/igdb';
import { RowDataPacket } from 'mysql2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params;
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const rotationId = parseInt(id);

    const [rows] = await db.execute(`
      SELECT rg.*, g.title, g.igdb_id, u.username, g.status as game_status
      FROM rotation_games rg
      JOIN games g ON rg.game_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE rg.rotation_id = ?
      ORDER BY rg.play_order ASC
    `, [rotationId]);

    const games = rows as RowDataPacket[];

    const gamesWithCovers = await Promise.all(
      games.map(async (game) => {
        const igdbGame = await igdbClient.getGameById(game.igdb_id);
        return {
          ...game,
          cover_url: igdbGame?.cover ? igdbClient.formatCoverUrl(igdbGame.cover.url) : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      games: gamesWithCovers,
    });
  } catch (error) {
    console.error('Get rotation games error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
