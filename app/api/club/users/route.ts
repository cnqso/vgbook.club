import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { clubId } = await request.json();

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
    }

    const [userRows] = await db.execute(
      'SELECT id, username FROM users WHERE club_id = ? ORDER BY username ASC',
      [clubId]
    );

    const users = userRows as { id: number; username: string }[];

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Fetch club users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
