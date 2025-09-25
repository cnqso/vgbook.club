import { NextRequest, NextResponse } from 'next/server';
import { igdbClient } from '@/lib/igdb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const games = await igdbClient.searchGames(query, limit);
    console.log(games);
    return NextResponse.json({
      success: true,
      games: games.map(game => ({
        id: game.id,
        name: game.name,
        cover_url: game.cover ? igdbClient.formatCoverUrl(game.cover.url) : null,
        summary: game.summary,
        platforms: game.platforms?.map(p => p.name).join(', '),
        release_date: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null,
      })),
    });
  } catch (error) {
    console.error('Game search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
