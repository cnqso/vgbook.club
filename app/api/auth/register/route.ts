import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { clubId, username, password } = await request.json();

    if (!clubId || !username) {
      return NextResponse.json(
        { error: 'Club ID and username are required' },
        { status: 400 }
      );
    }

  
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE club_id = ? AND username = ?',
      [clubId, username]
    );
    
    if ((existingUsers as RowDataPacket[]).length > 0) {
      return NextResponse.json(
        { error: 'Username already exists in this club' },
        { status: 409 }
      );
    }

  
    const hashedPassword = password ? hashPassword(password) : null;

  
    const [userCount] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE club_id = ?',
      [clubId]
    );
    
    const isFirstUser = (userCount as RowDataPacket[])[0].count === 0;

  
    const [result] = await db.execute(
      'INSERT INTO users (club_id, username, password, is_owner) VALUES (?, ?, ?, ?)',
      [clubId, username, hashedPassword, isFirstUser]
    );

    const userId = (result as RowDataPacket).insertId;

  
    if (isFirstUser) {
      await db.execute(
        'UPDATE clubs SET owner_id = ? WHERE id = ?',
        [userId, clubId]
      );
    }

  
    const token = generateToken({
      userId,
      clubId: parseInt(clubId),
      username,
      isOwner: isFirstUser,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        username,
        isOwner: isFirstUser,
        clubId: parseInt(clubId),
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
