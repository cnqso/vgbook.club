import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
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
      SELECT rg.*, g.title, g.cover_url, g.release_date, g.igdb_id, u.username, g.status as game_status
      FROM rotation_games rg
      JOIN games g ON rg.game_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE rg.rotation_id = ?
      ORDER BY rg.play_order ASC
    `, [rotationId]);

    const games = rows as RowDataPacket[];

    return NextResponse.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error('Get rotation games error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
