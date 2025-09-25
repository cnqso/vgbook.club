import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashClubPasscode } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { name, description, passcode } = await request.json();

    if (!name || !passcode) {
      return NextResponse.json(
        { error: 'Club name and passcode are required' },
        { status: 400 }
      );
    }

    const [existingClubs] = await db.execute(
      'SELECT id FROM clubs WHERE name = ?',
      [name]
    );
    
    if ((existingClubs as RowDataPacket[]).length > 0) {
      return NextResponse.json(
        { error: 'Club name already exists' },
        { status: 409 }
      );
    }

    const hashedPasscode = hashClubPasscode(passcode);

    const [result] = await db.execute(
      'INSERT INTO clubs (name, description, secret_passcode) VALUES (?, ?, ?)',
      [name, description || null, hashedPasscode]
    );

    const clubId = (result as RowDataPacket).insertId;

    return NextResponse.json({
      success: true,
      club: {
        id: clubId,
        name,
        description,
      },
    });
  } catch (error) {
    console.error('Club creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [rows] = await db.execute(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.created_at,
        COUNT(DISTINCT u.id) as member_count,
        COUNT(DISTINCT g.id) as total_games,
        COUNT(DISTINCT CASE WHEN g.status = 'played' THEN g.id END) as completed_games,
        (SELECT COUNT(*) FROM rotations r WHERE r.club_id = c.id AND r.status = 'active') as has_active_rotation
      FROM clubs c
      LEFT JOIN users u ON c.id = u.club_id
      LEFT JOIN games g ON u.id = g.user_id
      GROUP BY c.id, c.name, c.description, c.created_at
      HAVING member_count > 0
      ORDER BY c.created_at DESC
    `);
    
    return NextResponse.json({
      success: true,
      clubs: rows,
    });
  } catch (error) {
    console.error('Fetch clubs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
