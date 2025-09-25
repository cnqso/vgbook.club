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
    if (!user || !user.isOwner) {
      return NextResponse.json({ error: 'Only club owners can delete rotations' }, { status: 403 });
    }

    const resolvedParams = await params;
    const rotationId = parseInt(resolvedParams.id);

    const [rotationRows] = await db.execute(
      'SELECT id, status FROM rotations WHERE id = ? AND club_id = ?',
      [rotationId, user.clubId]
    );

    const rotations = rotationRows as RowDataPacket[];
    if (rotations.length === 0) {
      return NextResponse.json({ error: 'Rotation not found' }, { status: 404 });
    }

    const rotation = rotations[0];

    if (rotation.status === 'completed') {
      return NextResponse.json(
        { error: 'Completed rotations cannot be deleted to preserve history' },
        { status: 400 }
      );
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();


      if (rotation.status === 'active') {
  
        await connection.execute(`
          UPDATE games g
          JOIN rotation_games rg ON g.id = rg.game_id
          SET g.status = 'unplayed', g.date_started = NULL
          WHERE rg.rotation_id = ? AND rg.rotation_status = 'playing'
        `, [rotationId]);
      }


      await connection.execute(
        'DELETE FROM rotation_games WHERE rotation_id = ?',
        [rotationId]
      );


      await connection.execute(
        'DELETE FROM rotations WHERE id = ?',
        [rotationId]
      );

      await connection.commit();

      return NextResponse.json({ 
        success: true, 
        message: 'Rotation deleted successfully' 
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete rotation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
