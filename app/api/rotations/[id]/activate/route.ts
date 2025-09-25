import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !user.isOwner) {
      return NextResponse.json({ error: 'Only club owners can activate rotations' }, { status: 403 });
    }

    const rotationId = parseInt(params.id);

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();


      await connection.execute(
        'UPDATE rotations SET status = "completed", completed_at = NOW() WHERE club_id = ? AND status = "active"',
        [user.clubId]
      );


      await connection.execute(
        'UPDATE rotations SET status = "active", started_at = NOW() WHERE id = ? AND club_id = ?',
        [rotationId, user.clubId]
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
    console.error('Activate rotation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
