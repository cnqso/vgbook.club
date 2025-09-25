'use client';

import { useState, useEffect } from 'react';
import { ActiveRotation } from '@/lib/types';
import { formatGameTitleWithYear } from '@/lib/utils';
import Loading from '@/components/Loading';
import Image from 'next/image';

interface CurrentGame {
  id: number;
  title: string;
  username: string;
  cover_url?: string;
  release_date?: number;
  date_started: string;
  igdb_id: number;
}


interface RecentActivity {
  title: string;
  username: string;
  cover_url?: string;
  release_date?: number;
  date_finished: string;
}

export default function Dashboard() {
  const [currentGame, setCurrentGame] = useState<CurrentGame | null>(null);
  const [activeRotation, setActiveRotation] = useState<ActiveRotation | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const result = await response.json();
      
      if (response.ok) {
        setCurrentGame(result.currentGame);
        setActiveRotation(result.activeRotation);
        setRecentActivity(result.recentActivity);
      } else {
        console.error('Failed to fetch dashboard data:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
        <Loading text="LOADING DASHBOARD..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>



      {currentGame ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Currently Playing</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentGame.cover_url && (
                <img
                  src={currentGame.cover_url}
                //   width={480}
                //   height={640}
                  alt={currentGame.title}
                  className="current-game-cover"
                />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {formatGameTitleWithYear(currentGame.title, currentGame.release_date)}
              </h3>
              <p className="text-gray-600">Proposed by <span className="font-medium">{currentGame.username}</span></p>
              <p className="text-sm text-gray-500">
                Started {new Date(currentGame.date_started).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Currently Playing</h2>
          </div>
          <p className="text-gray-600">No game is currently being played.</p>
        </div>
      )}

      {activeRotation ? (
        <div className="container-brutal">
          <div className="container-brutal-header">
            ACTIVE ROTATION: {activeRotation.name}
          </div>
          
          <p style={{ marginBottom: '16px', fontSize: '12px', textTransform: 'uppercase' }}>
            STARTED: {new Date(activeRotation.created_at).toLocaleDateString()} | 
            GAMES: {activeRotation.total_rotation_games}
          </p>
          
          {activeRotation.games && activeRotation.games.length > 0 ? (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              {activeRotation.games.map((game) => (
                <div key={game.id} className="rotation-game-container">
                  {game.cover_url ? (
                    <img
                      src={game.cover_url}
                      alt={game.title}
                    //   width={240}
                    //   height={320}
                      title={`${formatGameTitleWithYear(game.title, game.release_date)} - ${game.username}`}
                      className={`rotation-game-cover ${game.rotation_status}`}
                    />
                  ) : (
                    <div 
                      className={`rotation-game-cover ${game.rotation_status}`}
                      title={`${formatGameTitleWithYear(game.title, game.release_date)} - ${game.username}`}
                      style={{
                        backgroundColor: 'var(--bg-overlay)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        textAlign: 'center',
                        padding: '4px'
                      }}
                    >
                      {game.title.substring(0, 8)}...
                    </div>
                  )}
                  <div className="rotation-game-tooltip">
                    {formatGameTitleWithYear(game.title, game.release_date)} - {game.username}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>NO GAMES IN ROTATION</p>
          )}
        </div>
      ) : (
        <div className="container-brutal">
          <div className="container-brutal-header">
            NO ACTIVE ROTATION
          </div>
          <p>Owners can create one from the Rotations page.</p>
        </div>
      )}

      <div className="container-brutal">
        <div className="container-brutal-header">
          RECENT ACTIVITY
        </div>
        {recentActivity.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px 0' }}>
            NO GAMES COMPLETED YET
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivity.map((activity, index: number) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: 'var(--bg-overlay)',
                border: '2px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {activity.cover_url ? (
                    <img
                      src={activity.cover_url}
                      alt={activity.title}
                    //   width={64}
                    //   height={84}
                      style={{
                        width: '32px',
                        height: '42px',
                        objectFit: 'cover',
                        border: '2px solid var(--border)'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '42px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '2px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px'
                    }}>
                      {activity.title.substring(0, 4)}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {formatGameTitleWithYear(activity.title, activity.release_date)}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      proposed by {activity.username}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {new Date(activity.date_finished).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
