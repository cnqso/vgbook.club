'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PlayIcon,
  CheckIcon,
  ClockIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';

interface Rotation {
  id: number;
  name: string;
  status: 'active' | 'completed' | 'planned';
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface RotationGame {
  id: number;
  title: string;
  username: string;
  rotation_status: 'unplayed' | 'playing' | 'played';
  cover_url?: string;
  play_order: number;
  date_started?: string;
  date_finished?: string;
}

interface CreateRotationData {
  name: string;
}

export default function Rotations() {
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [selectedRotation, setSelectedRotation] = useState<Rotation | null>(null);
  const [rotationGames, setRotationGames] = useState<RotationGame[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { user, loading: authLoading } = useAuth();
  const createForm = useForm<CreateRotationData>();



  const fetchRotations = useCallback(async () => {
    try {
      const response = await fetch('/api/rotations');
      const result = await response.json();

      if (response.ok) {
        setRotations(result.rotations);
        if (result.rotations.length > 0) {
          const activeRotation = result.rotations.find((r: Rotation) => r.status === 'active');
          if (activeRotation) {
            setSelectedRotation(activeRotation);
            fetchRotationGames(activeRotation.id);
          } else {
            setSelectedRotation(result.rotations[0]);
            fetchRotationGames(result.rotations[0].id);
          }
        }
      } else {
        toast.error('Failed to fetch rotations');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while fetching rotations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRotations();
  }, [fetchRotations]);

  const fetchRotationGames = async (rotationId: number) => {
    try {
      const response = await fetch(`/api/rotations/${rotationId}/games`);
      const result = await response.json();

      if (response.ok) {
        setRotationGames(result.games);
      } else {
        toast.error('Failed to fetch rotation games');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while fetching games');
    }
  };

  const createRotation = async (data: CreateRotationData) => {
    try {
      const response = await fetch('/api/rotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Rotation created successfully!');
        setShowCreateForm(false);
        createForm.reset();
        fetchRotations();
      } else {
        toast.error(result.error || 'Failed to create rotation');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const activateRotation = async (rotationId: number) => {
    try {
      const response = await fetch(`/api/rotations/${rotationId}/activate`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Rotation activated!');
        fetchRotations();
      } else {
        toast.error('Failed to activate rotation');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const spinWheel = async () => {
    try {
      const response = await fetch('/api/rotations/spin', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        const { selectedGame, spinInfo } = result;
        toast.success(
          `"${selectedGame.title}" from ${selectedGame.username} is now playing` +
          (spinInfo ? ` (Selected from ${spinInfo.totalOptions} options)` : '')
        );
        if (selectedRotation) {
          fetchRotationGames(selectedRotation.id);
        }
      } else {
        toast.error(result.error || 'Failed to spin wheel');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const finishGame = async (rotationGameId: number) => {
    try {
      const response = await fetch('/api/rotations/finish-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotationGameId }),
      });

      if (response.ok) {
        toast.success('Game marked as finished!');
        if (selectedRotation) {
          fetchRotationGames(selectedRotation.id);
          
          fetchRotations();
        }
      } else {
        toast.error('Failed to finish game');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const deleteRotation = async (rotationId: number, rotationName: string) => {
    if (!confirm(`Are you sure you want to delete "${rotationName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/rotations/${rotationId}/delete`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Rotation deleted successfully!');
        fetchRotations();
        
        if (selectedRotation?.id === rotationId) {
          setSelectedRotation(null);
          setRotationGames([]);
        }
      } else {
        toast.error(result.error || 'Failed to delete rotation');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'playing':
        return <PlayIcon className="h-4 w-4 text-green-600" />;
      case 'played':
        return <CheckIcon className="h-4 w-4 text-gray-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="LOADING ROTATIONS..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access rotations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rotations</h1>
          <p className="mt-2 text-gray-100">Manage game rotations and track progress</p>
        </div>
        {user.isOwner ? (
          <div className="flex space-x-3">
            <button
              onClick={spinWheel}
              className="bg-rose-300 hover:bg-rose-400 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors cursor-pointer"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Spin Wheel
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors cursor-pointer"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Rotation
            </button>
          </div>
        ) : null}
      </div>

      
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Create New Rotation</h2>
            </div>

            <form onSubmit={createForm.handleSubmit(createRotation)} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rotation Name
                </label>
                <input
                  {...createForm.register('name', { required: 'Rotation name is required' })}
                  type="text"
                  placeholder="e.g., Summer 2024 Rotation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {createForm.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createForm.formState.isSubmitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-md disabled:opacity-50 cursor-pointer"
                >
                  {createForm.formState.isSubmitting ? 'Creating...' : 'Create Rotation'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    createForm.reset();
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">All Rotations</h2>
          <div className="space-y-3">
            {rotations.map((rotation) => (
              <div
                key={rotation.id}
                onClick={() => {
                  setSelectedRotation(rotation);
                  fetchRotationGames(rotation.id);
                }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedRotation?.id === rotation.id
                    ? 'border-yellow-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{rotation.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rotation.status)}`}>
                      {rotation.status}
                    </span>
                    {user.isOwner && rotation.status !== 'completed' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRotation(rotation.id, rotation.name);
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete rotation"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Created {new Date(rotation.created_at).toLocaleDateString()}
                </p>
                <div className="flex space-x-2 mt-2">
                  {user.isOwner && rotation.status === 'planned' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        activateRotation(rotation.id);
                      }}
                      className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded cursor-pointer"
                    >
                      Activate
                    </button>
                  ) : null}
                  {rotation.status === 'completed' ? (
                    <span className="text-xs text-gray-500 italic">
                      Completed {rotation.completed_at ? new Date(rotation.completed_at).toLocaleDateString() : ''}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        
        <div className="lg:col-span-2">
          {selectedRotation ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedRotation.name}</h2>
                  <p className="text-gray-600">
                    Status: <span className="font-medium">{selectedRotation.status}</span>
                  </p>
                </div>
              
              </div>

              <div className="space-y-4">
                {rotationGames.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No games in this rotation</p>
                  </div>
                ) : (
                  rotationGames.map((game) => (
                    <div key={game.id} className="bg-white border rounded-lg p-4 flex items-center space-x-4">
                      <div className="text-sm font-medium text-gray-500 w-8">
                        #{game.play_order}
                      </div>

                      {game.cover_url ? (
                        <img
                          src={game.cover_url}
                          alt={game.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : null}

                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{game.title}</h3>
                        <p className="text-sm text-gray-600">from {game.username}</p>
                        {game.date_started ? (
                          <p className="text-xs text-gray-500">
                            Started {new Date(game.date_started).toLocaleDateString()}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusIcon(game.rotation_status)}
                        <span className="text-sm font-medium capitalize">
                          {game.rotation_status === 'played' ? 'Completed' : game.rotation_status}
                        </span>
                      </div>

                      {user.isOwner && game.rotation_status === 'playing' ? (
                        <button
                          onClick={() => finishGame(game.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Finish
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No rotation selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
