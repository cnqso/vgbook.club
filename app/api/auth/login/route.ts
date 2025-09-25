import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { clubId, username, password } = await request.json();
    console.log('Login attempt:', { clubId, username, hasPassword: !!password });

    if (!clubId || !username) {
      return NextResponse.json(
        { error: 'Club ID and username are required' },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE club_id = ? AND username = ?',
      [clubId, username]
    );
    
    const users = rows as RowDataPacket[];
    
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    if (user.password && password) {
      if (!verifyPassword(password, user.password)) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }
    } else if (user.password && !password) {
      return NextResponse.json(
        { error: 'Password required' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user.id,
      clubId: user.club_id,
      username: user.username,
      isOwner: user.is_owner,
    });

    console.log('Generated token for user:', user.username, 'Token length:', token.length);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isOwner: user.is_owner,
        clubId: user.club_id,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    console.log('Login successful, cookie set');
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
