'use client';

import { useState, useEffect, useCallback } from 'react';
import Loading from '@/components/Loading';
import Image from 'next/image';

interface Member {
  id: number;
  username: string;
  is_owner: boolean;
  created_at: string;
  gameCount: number;
  completedCount: number;
  playingCount: number;
  queuedCount: number;
}

interface MemberGame {
  id: number;
  title: string;
  status: 'unplayed' | 'playing' | 'played';
  cover_url?: string;
  position_in_queue: number;
}

let membersCache: {
  data: Member[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; 

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberGames, setMemberGames] = useState<MemberGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      
      const now = Date.now();
      if (membersCache.data && (now - membersCache.timestamp) < CACHE_DURATION) {
        console.log('Using cached members data');
        setMembers(membersCache.data);
        if (membersCache.data.length > 0) {
          setSelectedMember(membersCache.data[0]);
          fetchMemberGames(membersCache.data[0].id);
        }
        setLoading(false);
        return;
      }

      
      console.log('Fetching fresh members data');
      const response = await fetch('/api/club/members');
      const result = await response.json();

      if (response.ok) {
        
        membersCache = {
          data: result.members,
          timestamp: now,
        };

        setMembers(result.members);
        if (result.members.length > 0) {
          setSelectedMember(result.members[0]);
          fetchMemberGames(result.members[0].id);
        }
      } else {
        console.error('Failed to fetch members:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);


  const fetchMemberGames = async (userId: number) => {
    setGamesLoading(true);
    try {
      const response = await fetch(`/api/games?userId=${userId}`);
      const result = await response.json();

      if (response.ok) {
        setMemberGames(result.games);
      } else {
        console.error('Failed to fetch member games');
        setMemberGames([]);
      }
    } catch (error) {
      console.error('Failed to fetch member games', error);
      setMemberGames([]);
    } finally {
      setGamesLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing':
        return 'bg-green-100 text-green-800';
      case 'played':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'playing':
        return 'Playing';
      case 'played':
        return 'Completed';
      default:
        return 'Queued';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="LOADING MEMBERS..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Club Members</h1>
        <p className="mt-2 text-gray-100">View member profiles and their game queues</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Members ({members.length})</h2>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                onClick={() => {
                  setSelectedMember(member);
                  fetchMemberGames(member.id);
                }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedMember?.id === member.id
                  ? 'border-yellow-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center space-x-3">

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{member.username}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{member.gameCount}</div>
                    <div className="text-xs text-gray-600">Proposals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{member.completedCount}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Details */}
        <div className="lg:col-span-2">
          {selectedMember ? (
            <div>
              <div className="bg-white border rounded-lg p-6 pt-3 pb-0 mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedMember.username}</h2>
                    </div>
                    <p className="text-gray-600">
                      Member since {new Date(selectedMember.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>


              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedMember.username}&apos;s Game Queue
                </h3>

                {gamesLoading ? (
                  <div className="text-center py-8">
                    <Loading size="sm" text="LOADING GAMES..." />
                  </div>
                ) : memberGames.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No games in queue</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memberGames.map((game, index) => (
                      <div key={game.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 w-8">
                          #{index + 1}
                        </div>

                        {game.cover_url && (
                          <Image
                            src={game.cover_url}
                            width={240}
                            height={320}
                            alt={game.title}
                            className="w-10 h-14 object-cover rounded"
                          />
                        )}

                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{game.title}</h4>
                        </div>

                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(game.status)}`}>
                          {getStatusText(game.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Select a member to view their profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
