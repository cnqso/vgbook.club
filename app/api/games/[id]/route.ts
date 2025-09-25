import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const resolvedParams = await params;
    const gameId = parseInt(resolvedParams.id);

    const [gameRows] = await db.execute(
      'SELECT position_in_queue FROM games WHERE id = ? AND user_id = ?',
      [gameId, user.userId]
    );

    const games = gameRows as RowDataPacket[];
    if (games.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const deletedPosition = games[0].position_in_queue;

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();


      await connection.execute('DELETE FROM games WHERE id = ?', [gameId]);


      await connection.execute(
        'UPDATE games SET position_in_queue = position_in_queue - 1 WHERE user_id = ? AND position_in_queue > ?',
        [user.userId, deletedPosition]
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
    console.error('Delete game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
