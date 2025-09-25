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
      return NextResponse.json({ error: 'Only club owners can spin the wheel' }, { status: 403 });
    }

    const [rotationRows] = await db.execute(
      'SELECT id FROM rotations WHERE club_id = ? AND status = "active"',
      [user.clubId]
    );

    const rotations = rotationRows as RowDataPacket[];
    if (rotations.length === 0) {
      return NextResponse.json(
        { error: 'No active rotation found' },
        { status: 404 }
      );
    }

    const rotationId = rotations[0].id;

    const [gameRows] = await db.execute(`
      SELECT rg.*, g.title, g.igdb_id, u.username
      FROM rotation_games rg
      JOIN games g ON rg.game_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE rg.rotation_id = ? AND rg.rotation_status = 'unplayed'
      ORDER BY rg.play_order ASC
    `, [rotationId]);

    const unplayedGames = gameRows as RowDataPacket[];
    if (unplayedGames.length === 0) {
      return NextResponse.json(
        { error: 'No unplayed games in current rotation' },
        { status: 404 }
      );
    }

    const [playingGames] = await db.execute(
      'SELECT id FROM rotation_games WHERE rotation_id = ? AND rotation_status = "playing"',
      [rotationId]
    );

    if ((playingGames as RowDataPacket[]).length > 0) {
      return NextResponse.json(
        { error: 'A game is already being played in this rotation' },
        { status: 409 }
      );
    }

    const randomIndex = Math.floor(Math.random() * unplayedGames.length);
    const selectedGame = unplayedGames[randomIndex];
    
    console.log(`Spinning the wheel! ${unplayedGames.length} games available.`);
    console.log(`Selected: "${selectedGame.title}" by ${selectedGame.username} (index ${randomIndex})`);

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();


      await connection.execute(
        'UPDATE rotation_games SET rotation_status = "playing", date_started = NOW() WHERE id = ?',
        [selectedGame.id]
      );


      await connection.execute(
        'UPDATE games SET status = "playing", date_started = NOW() WHERE id = ?',
        [selectedGame.game_id]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        selectedGame: {
          id: selectedGame.id,
          gameId: selectedGame.game_id,
          title: selectedGame.title,
          username: selectedGame.username,
          igdbId: selectedGame.igdb_id,
        },
        spinInfo: {
          totalOptions: unplayedGames.length,
          selectedIndex: randomIndex,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Spin wheel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
