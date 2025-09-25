import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !user.isOwner) {
      return NextResponse.json({ error: 'Only club owners can finish games' }, { status: 403 });
    }

    const { rotationGameId } = await request.json();

    if (!rotationGameId) {
      return NextResponse.json(
        { error: 'Rotation game ID is required' },
        { status: 400 }
      );
    }

    const [rotationGameRows] = await db.execute(
      'SELECT game_id, rotation_id FROM rotation_games WHERE id = ? AND rotation_status = "playing"',
      [rotationGameId]
    );

    const rotationGames = rotationGameRows as RowDataPacket[];
    if (rotationGames.length === 0) {
      return NextResponse.json(
        { error: 'Game not found or not currently playing' },
        { status: 404 }
      );
    }

    const { game_id: gameId } = rotationGames[0];

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();


      await connection.execute(
        'UPDATE rotation_games SET rotation_status = "played", date_finished = NOW() WHERE id = ?',
        [rotationGameId]
      );


      await connection.execute(
        'UPDATE games SET status = "played", date_finished = NOW() WHERE id = ?',
        [gameId]
      );


      const [remainingGames] = await connection.execute(
        'SELECT COUNT(*) as count FROM rotation_games WHERE rotation_id = (SELECT rotation_id FROM rotation_games WHERE id = ?) AND rotation_status != "played"',
        [rotationGameId]
      );

      const remainingCount = (remainingGames as RowDataPacket[])[0].count;


      if (remainingCount === 0) {
        await connection.execute(
          'UPDATE rotations SET status = "completed", completed_at = NOW() WHERE id = (SELECT rotation_id FROM rotation_games WHERE id = ?)',
          [rotationGameId]
        );
      }

      await connection.commit();

      return NextResponse.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Finish game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
