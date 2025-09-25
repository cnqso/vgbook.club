import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !user.isOwner) {
      return NextResponse.json({ error: 'Only club owners can create rotations' }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Rotation name is required' },
        { status: 400 }
      );
    }

    const [activeRotations] = await db.execute(
      'SELECT id FROM rotations WHERE club_id = ? AND status = "active"',
      [user.clubId]
    );

    if ((activeRotations as RowDataPacket[]).length > 0) {
      return NextResponse.json(
        { error: 'There is already an active rotation' },
        { status: 409 }
      );
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();


      const [rotationResult] = await connection.execute(
        'INSERT INTO rotations (club_id, name, status) VALUES (?, ?, "planned")',
        [user.clubId, name]
      );

      const rotationId = (rotationResult as ResultSetHeader).insertId;


      const [userGames] = await connection.execute(`
        SELECT g.id, g.user_id, g.title, g.igdb_id, u.username
        FROM games g
        JOIN users u ON g.user_id = u.id
        WHERE u.club_id = ? 
          AND g.status = 'unplayed'
          AND g.position_in_queue = (
            SELECT MIN(position_in_queue) 
            FROM games g2 
            WHERE g2.user_id = g.user_id 
              AND g2.status = 'unplayed'
          )
        ORDER BY g.user_id
      `, [user.clubId]);

      const games = userGames as RowDataPacket[];


      for (let i = 0; i < games.length; i++) {
        await connection.execute(
          'INSERT INTO rotation_games (rotation_id, game_id, play_order) VALUES (?, ?, ?)',
          [rotationId, games[i].id, i + 1]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        rotation: {
          id: rotationId,
          name,
          status: 'planned',
          gameCount: games.length,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create rotation error:', error);
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

    const [rows] = await db.execute(
      'SELECT * FROM rotations WHERE club_id = ? ORDER BY created_at DESC',
      [user.clubId]
    );

    return NextResponse.json({
      success: true,
      rotations: rows,
    });
  } catch (error) {
    console.error('Get rotations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
