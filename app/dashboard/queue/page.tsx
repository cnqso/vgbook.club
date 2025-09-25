'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { formatGameTitleWithYear } from '@/lib/utils';
import Loading from '@/components/Loading';
import Image from 'next/image';

interface Game {
  id: number;
  igdb_id: number;
  title: string;
  status: 'unplayed' | 'playing' | 'played';
  position_in_queue: number;
  cover_url?: string;
  release_date?: number;
  date_added: string;
}

interface SearchGame {
  id: number;
  name: string;
  cover_url?: string;
  summary?: string;
  platforms?: string;
  release_date?: number; 
  first_release_date?: number; 
}

interface SearchFormData {
  query: string;
}

export default function Queue() {
  const [games, setGames] = useState<Game[]>([]);
  const [searchResults, setSearchResults] = useState<SearchGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [loading, setLoading] = useState(true);

  const searchForm = useForm<SearchFormData>();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      const result = await response.json();
      
      if (response.ok) {
        setGames(result.games);
      } else {
        toast.error('Failed to fetch games');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while fetching games');
    } finally {
      setLoading(false);
    }
  };

  const searchGames = async (data: SearchFormData) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(data.query)}`);
      const result = await response.json();
      
      if (response.ok) {
        setSearchResults(result.games);
      } else {
        toast.error('Failed to search games');
      }
    } catch (error) {
      console.error(error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const addGameToQueue = async (game: SearchGame) => {
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          igdbId: game.id,
          title: game.name,
          coverUrl: game.cover_url,
          releaseDate: game.first_release_date,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Game added to queue!');
        setShowAddGame(false);
        setSearchResults([]);
        searchForm.reset();
        fetchGames();
      } else {
        toast.error(result.error || 'Failed to add game');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const removeGame = async (gameId: number) => {
    if (!confirm('Are you sure you want to remove this game from your queue?')) {
      return;
    }

    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Game removed from queue');
        fetchGames();
      } else {
        toast.error('Failed to remove game');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
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

  const moveGameUp = async (gameId: number, currentIndex: number) => {
    if (currentIndex === 0) return; 
    
    try {
      const response = await fetch('/api/games/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameId,
          direction: 'up'
        }),
      });

      if (response.ok) {
        fetchGames(); 
        toast.success('Game moved up!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to move game');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const moveGameDown = async (gameId: number, currentIndex: number) => {
    if (currentIndex === games.length - 1) return; 
    
    try {
      const response = await fetch('/api/games/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameId,
          direction: 'down'
        }),
      });

      if (response.ok) {
        fetchGames(); 
        toast.success('Game moved down!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to move game');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="LOADING QUEUE..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Game Queue</h1>
          <p className="mt-2 text-gray-100">Manage your proposed games</p>
        </div>
        <button
          onClick={() => setShowAddGame(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors cursor-pointer"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Game
        </button>
      </div>

      {/* Add Game Modal */}
      {showAddGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Add Game to Queue</h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={searchForm.handleSubmit(searchGames)} className="mb-6">
                <div className="flex space-x-2">
                  <input
                    {...searchForm.register('query', { required: 'Search query is required' })}
                    type="text"
                    placeholder="e.g. 'metal gear solid v'"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-rose-400 hover:bg-rose-300 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50 cursor-pointer"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                </div>
              </form>

              <div className="max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-8">
                    <Loading size="sm" text="SEARCHING..." />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((game) => (
                      <div key={game.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                        {game.cover_url && (
                          <img
                            src={game.cover_url}
                            // width={240}
                            // height={320}
                            alt={game.name}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {formatGameTitleWithYear(game.name, game.first_release_date)}
                          </h3>
                          {game.platforms && (
                            <p className="text-sm text-gray-600">{game.platforms}</p>
                          )}
                          {game.release_date && (
                            <p className="text-sm text-gray-500">{game.release_date}</p>
                          )}
                        </div>
                        <button
                          onClick={() => addGameToQueue(game)}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded text-sm cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Search for games to add to your queue
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowAddGame(false);
                  setSearchResults([]);
                  searchForm.reset();
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Games List */}
      {games.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No games in queue</h3>

          <button
            onClick={() => setShowAddGame(true)}
            className="bg-rose-400 hover:bg-rose-300 text-white font-medium py-2 px-4 rounded-lg cursor-pointer"
          >
            Add Your First Game
          </button>
          <p className="text-gray-100 mt-4">Your top game will be added to the next rotation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((game, index) => (
            <div key={game.id} className="bg-white border rounded-lg p-4 flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-500 w-8">
                #{index + 1}
              </div>
              
              {game.cover_url && (
                <img
                //   width={240}
                //   height={320}
                  src={game.cover_url}
                  alt={game.title}
                  className="w-12 h-16 object-cover rounded"
                />
              )}
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {formatGameTitleWithYear(game.title, game.release_date)}
                </h3>
                <p className="text-sm text-gray-600">
                  Added {new Date(game.date_added).toLocaleDateString()}
                </p>
              </div>
              
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(game.status)}`}>
                {getStatusText(game.status)}
              </span>
              
              {game.status === 'unplayed' && (
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => moveGameUp(game.id, index)}
                    disabled={index === 0}
                    className={`p-1 ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`}
                    title="Move up"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveGameDown(game.id, index)}
                    disabled={index === games.length - 1}
                    className={`p-1 ${index === games.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`}
                    title="Move down"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {game.status === 'unplayed' && (
                <button
                  onClick={() => removeGame(game.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Remove game"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
