import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

    const { gameId, direction } = await request.json();

    if (!gameId || !direction) {
      return NextResponse.json(
        { error: 'Game ID and direction are required' },
        { status: 400 }
      );
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [gameRows] = await connection.execute(
        'SELECT position_in_queue FROM games WHERE id = ? AND user_id = ?',
        [gameId, user.userId]
      );

      const games = gameRows as { position_in_queue: number }[];
      if (games.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }

      const currentPosition = games[0].position_in_queue;
      let swapPosition: number;

      if (direction === 'up') {
        swapPosition = currentPosition - 1;
      } else if (direction === 'down') {
        swapPosition = currentPosition + 1;
      } else {
        await connection.rollback();
        return NextResponse.json({ error: 'Invalid direction' }, { status: 400 });
      }

      const [swapGameRows] = await connection.execute(
        'SELECT id FROM games WHERE position_in_queue = ? AND user_id = ?',
        [swapPosition, user.userId]
      );

      const swapGames = swapGameRows as { id: number }[];
      if (swapGames.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Cannot move in that direction' }, { status: 400 });
      }

      const swapGameId = swapGames[0].id;

      await connection.execute(
        'UPDATE games SET position_in_queue = ? WHERE id = ? AND user_id = ?',
        [swapPosition, gameId, user.userId]
      );

      await connection.execute(
        'UPDATE games SET position_in_queue = ? WHERE id = ? AND user_id = ?',
        [currentPosition, swapGameId, user.userId]
      );

      await connection.commit();

      return NextResponse.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Reorder games error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
