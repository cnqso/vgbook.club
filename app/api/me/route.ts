import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    console.log('GET /api/me - Token present:', !!token);
    
    if (!token) {
      console.log('No token found in cookies');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user) {
      console.log('Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('User authenticated successfully:', user.username);

    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        clubId: user.clubId,
        isOwner: user.isOwner,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
