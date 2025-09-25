import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyClubPasscode } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { clubName, passcode } = await request.json();

    if (!clubName || !passcode) {
      return NextResponse.json(
        { error: 'Club name and passcode are required' },
        { status: 400 }
      );
    }

    
    const [rows] = await db.execute(
      'SELECT * FROM clubs WHERE name = ?',
      [clubName]
    );
    
    const clubs = rows as RowDataPacket[];
    
    if (clubs.length === 0) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    const club = clubs[0];

    
    if (!verifyClubPasscode(passcode, club.secret_passcode)) {
      return NextResponse.json(
        { error: 'Invalid passcode' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      club: {
        id: club.id,
        name: club.name,
        description: club.description,
      },
    });
  } catch (error) {
    console.error('Club authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
