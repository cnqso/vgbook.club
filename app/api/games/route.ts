import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { igdbClient } from '@/lib/igdb';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { igdbId, title } = await request.json();

    if (!igdbId || !title) {
      return NextResponse.json(
        { error: 'IGDB ID and title are required' },
        { status: 400 }
      );
    }

    const [existingGames] = await db.execute(
      'SELECT id FROM games WHERE user_id = ? AND igdb_id = ?',
      [user.userId, igdbId]
    );

    if ((existingGames as RowDataPacket[]).length > 0) {
      return NextResponse.json(
        { error: 'Game already in your queue' },
        { status: 409 }
      );
    }

    const [positionResult] = await db.execute(
      'SELECT COALESCE(MAX(position_in_queue), 0) + 1 as next_position FROM games WHERE user_id = ?',
      [user.userId]
    );

    const nextPosition = (positionResult as RowDataPacket[])[0].next_position;

    const [result] = await db.execute(
      'INSERT INTO games (user_id, igdb_id, title, position_in_queue) VALUES (?, ?, ?, ?)',
      [user.userId, igdbId, title, nextPosition]
    );

    return NextResponse.json({
      success: true,
      game: {
        id: (result as RowDataPacket).insertId,
        igdb_id: igdbId,
        title,
        status: 'unplayed',
        position_in_queue: nextPosition,
      },
    });
  } catch (error) {
    console.error('Add game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const targetUserId = userId ? parseInt(userId) : user.userId;

    const [rows] = await db.execute(
      `SELECT g.*, u.username 
       FROM games g 
       JOIN users u ON g.user_id = u.id 
       WHERE g.user_id = ? 
       ORDER BY g.position_in_queue ASC`,
      [targetUserId]
    );

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
    console.error('Get games error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
