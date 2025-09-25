'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface Club {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  member_count: number;
  total_games: number;
  completed_games: number;
  has_active_rotation: number;
}

interface PasscodeFormData {
  passcode: string;
}

interface UserFormData {
  selectedUserId: string;
  username?: string;
  password?: string;
}

interface CreateClubData {
  name: string;
  description?: string;
  passcode: string;
}

export default function Home() {
  const [step, setStep] = useState<'browse' | 'passcode' | 'user' | 'create'>('browse');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubUsers, setClubUsers] = useState<{id: number, username: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user: authUser, refetchUser } = useAuth();

  const passcodeForm = useForm<PasscodeFormData>();
  const userForm = useForm<UserFormData>();
  const createClubForm = useForm<CreateClubData>();

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (authUser) {
      router.push('/dashboard');
    }
  }, [authUser, router]);

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs');
      const result = await response.json();
      
      if (response.ok) {
        setClubs(result.clubs);
      } else {
        toast.error('Failed to fetch clubs');
      }
    } catch (error) {
      console.error(error)
      toast.error('An error occurred while fetching clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleClubSelect = (club: Club) => {
    setSelectedClub(club);
    setStep('passcode');
  };

  const handlePasscodeSubmit = async (data: PasscodeFormData) => {
    if (!selectedClub) return;

    try {
      const response = await fetch('/api/auth/club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubName: selectedClub.name,
          passcode: data.passcode,
        }),
      });

      const result = await response.json();

        if (response.ok) {
          toast.success(`Welcome to ${selectedClub.name}!`);
          
          const usersResponse = await fetch('/api/club/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clubId: selectedClub?.id }),
          });
          
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setClubUsers(usersData.users);
          }
          
          setStep('user');
        } else {
          toast.error(result.error || 'Invalid passcode');
        }
    } catch (error) {
      console.error(error)
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleCreateClub = async (data: CreateClubData) => {
    try {
      const response = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
          toast.success('Club created successfully!');
          setSelectedClub(result.club);
          setClubUsers([]); 
          setStep('user');
      } else {
        toast.error(result.error || 'Failed to create club');
      }
    } catch (error) {
      console.error(error)
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleUserSubmit = async (data: UserFormData) => {
    if (!selectedClub) return;

    try {
      const isNewUser = data.selectedUserId === 'new';
      const endpoint = isNewUser ? '/api/auth/register' : '/api/auth/login';
      
      let requestBody;
      if (isNewUser) {
        requestBody = {
          clubId: selectedClub.id,
          username: data.username,
          password: data.password || undefined,
        };
      } else {
        const selectedUser = clubUsers.find(u => u.id.toString() === data.selectedUserId);
        requestBody = {
          clubId: selectedClub.id,
          username: selectedUser?.username,
          password: data.password || undefined,
        };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`${isNewUser ? 'Registered' : 'Logged in'} successfully!`);
        
        await refetchUser();
        router.push('/dashboard');
      } else {
        toast.error(result.error || `Failed to ${isNewUser ? 'register' : 'login'}`);
      }
    } catch (error) {
      console.error(error)
      toast.error('An error occurred. Please try again.');
    }
  };

  if (step === 'user') {
    const selectedUserIdValue = userForm.watch('selectedUserId');
    const isNewUser = selectedUserIdValue === 'new';

  return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-base)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="container-brutal" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="container-brutal-header">
            {selectedClub?.name} - SELECT USER
          </div>
          
          <form onSubmit={userForm.handleSubmit(handleUserSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>
                SELECT USER
              </label>
              <select
                {...userForm.register('selectedUserId', { required: 'Please select a user' })}
                style={{ width: '100%' }}
              >
                <option value="">-- SELECT A USER --</option>
                {clubUsers.map(user => (
                  <option key={user.id} value={user.id.toString()}>{user.username}</option>
                ))}
                <option value="new">+ NEW USER</option>
              </select>
              {userForm.formState.errors.selectedUserId && (
                <p style={{ color: 'var(--error)', fontSize: '12px', marginTop: '8px' }}>
                  {userForm.formState.errors.selectedUserId.message}
                </p>
              )}
            </div>
            
            {isNewUser && (
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>
                  USERNAME
                </label>
                <input
                  {...userForm.register('username', { required: isNewUser ? 'Username is required' : false })}
                  type="text"
                  placeholder="Enter username"
                />
                {userForm.formState.errors.username && (
                  <p style={{ color: 'var(--error)', fontSize: '12px', marginTop: '8px' }}>
                    {userForm.formState.errors.username.message}
                  </p>
                )}
              </div>
            )}
            
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>
                PASSWORD (OPTIONAL)
              </label>
              <input
                {...userForm.register('password')}
                type="password"
                placeholder="Enter password (optional)"
              />
            </div>
            
            <button
              type="submit"
              disabled={userForm.formState.isSubmitting}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {userForm.formState.isSubmitting ? 'PROCESSING...' : (isNewUser ? 'REGISTER' : 'LOGIN')}
            </button>
          </form>
          
          <button
            onClick={() => setStep('passcode')}
            className="btn-secondary"
            style={{ width: '100%', marginTop: '16px' }}
          >
            ← BACK TO PASSCODE
          </button>
        </div>
      </div>
    );
  }

  if (step === 'passcode') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-base)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="container-brutal" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="container-brutal-header">
            {selectedClub?.name}
          </div>
          <p style={{ marginBottom: '24px', textAlign: 'center' }}>Enter the club passcode to continue</p>
          
          <form onSubmit={passcodeForm.handleSubmit(handlePasscodeSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>
                CLUB PASSCODE
              </label>
              <input
                {...passcodeForm.register('passcode', { required: 'Passcode is required' })}
                type="password"
                placeholder="Enter club passcode"
                autoFocus
              />
              {passcodeForm.formState.errors.passcode && (
                <p style={{ color: 'var(--error)', fontSize: '12px', marginTop: '8px' }}>
                  {passcodeForm.formState.errors.passcode.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={passcodeForm.formState.isSubmitting}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {passcodeForm.formState.isSubmitting ? 'VERIFYING...' : 'ENTER CLUB'}
            </button>
          </form>
          <button
            onClick={() => setStep('browse')}
            className="btn-secondary"
            style={{ width: '100%', marginTop: '16px' }}
          >
            ← BACK TO CLUBS
          </button>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-base)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="container-brutal" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="container-brutal-header">
            CREATE NEW CLUB
          </div>
          
          <form onSubmit={createClubForm.handleSubmit(handleCreateClub)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>
                CLUB NAME
              </label>
              <input
                {...createClubForm.register('name', { required: 'Club name is required' })}
                type="text"
                placeholder="Enter club name"
              />
              {createClubForm.formState.errors.name && (
                <p style={{ color: 'var(--error)', fontSize: '12px', marginTop: '8px' }}>
                  {createClubForm.formState.errors.name.message}
                </p>
              )}
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>
                DESCRIPTION (OPTIONAL)
              </label>
              <textarea
                {...createClubForm.register('description')}
                placeholder="Describe your club"
                rows={3}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>
                CLUB PASSCODE
              </label>
              <input
                {...createClubForm.register('passcode', { required: 'Passcode is required' })}
                type="password"
                placeholder="Set club passcode"
              />
              {createClubForm.formState.errors.passcode && (
                <p style={{ color: 'var(--error)', fontSize: '12px', marginTop: '8px' }}>
                  {createClubForm.formState.errors.passcode.message}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={createClubForm.formState.isSubmitting}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {createClubForm.formState.isSubmitting ? 'CREATING...' : 'CREATE CLUB'}
            </button>
          </form>
          
          <button
            onClick={() => setStep('browse')}
            className="btn-secondary"
            style={{ width: '100%', marginTop: '16px' }}
          >
            ← BACK TO CLUBS
          </button>
        </div>
      </div>
    );
  }

  if (step === 'browse') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        fontFamily: 'Fira Code, monospace',
        padding: '32px 16px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: 'bold', 
              margin: '0 0 24px 0',
              textTransform: 'uppercase'
            }}>
              vgbook.club
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: 'var(--text-secondary)', 
              margin: '0 0 16px 0',
              textTransform: 'uppercase'
            }}>
              Like book clubs but for video games
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '32px',
            borderBottom: '2px solid var(--border)',
            paddingBottom: '16px'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              margin: '0',
              textTransform: 'uppercase'
            }}>
              ACTIVE CLUBS
            </h2>
            <button
              onClick={() => setStep('create')}
              className="btn-primary"
            >
              CREATE CLUB
            </button>
          </div>

          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '200px',
              fontSize: '14px',
              textTransform: 'uppercase'
            }}>
              LOADING CLUBS...
            </div>
          ) : clubs.length === 0 ? (
            <div className="container-brutal" style={{ textAlign: 'center', padding: '48px 16px' }}>
              <div className="container-brutal-header">
                NO CLUBS YET
              </div>
              <p style={{ marginBottom: '24px' }}>Be the first to create a gaming club!</p>
              <button
                onClick={() => setStep('create')}
                className="btn-primary"
              >
                CREATE FIRST CLUB
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '24px' 
            }}>
              {clubs.map((club) => (
                <div
                  key={club.id}
                  onClick={() => handleClubSelect(club)}
                  className="container-brutal"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="container-brutal-header">
                    {club.name} {club.has_active_rotation > 0 && '[ACTIVE]'}
                  </div>
                  
                  {club.description && (
                    <p style={{ marginBottom: '16px', fontSize: '14px' }}>{club.description}</p>
                  )}
                  
                  <table style={{ marginBottom: '16px' }}>
                    <tbody>
                      <tr>
                        <td>MEMBERS</td>
                        <td style={{ fontWeight: 'bold' }}>{club.member_count}</td>
                      </tr>
                      <tr>
                        <td>TOTAL GAMES</td>
                        <td style={{ fontWeight: 'bold' }}>{club.total_games}</td>
                      </tr>
                      <tr>
                        <td>COMPLETED</td>
                        <td style={{ fontWeight: 'bold' }}>{club.completed_games}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}>
                    CREATED {new Date(club.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'passcode') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-base)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="container-brutal" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="container-brutal-header">
            {selectedClub?.name}
          </div>
          <p style={{ marginBottom: '24px', textAlign: 'center' }}>Enter the club passcode to continue</p>
          
          <form onSubmit={passcodeForm.handleSubmit(handlePasscodeSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>
                CLUB PASSCODE
              </label>
              <input
                {...passcodeForm.register('passcode', { required: 'Passcode is required' })}
                type="password"
                placeholder="Enter club passcode"
                autoFocus
              />
              {passcodeForm.formState.errors.passcode && (
                <p style={{ color: 'var(--error)', fontSize: '12px', marginTop: '8px' }}>
                  {passcodeForm.formState.errors.passcode.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={passcodeForm.formState.isSubmitting}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {passcodeForm.formState.isSubmitting ? 'VERIFYING...' : 'ENTER CLUB'}
            </button>
          </form>
          <button
            onClick={() => setStep('browse')}
            className="btn-secondary"
            style={{ width: '100%', marginTop: '16px' }}
          >
            ← BACK TO CLUBS
          </button>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-base)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="container-brutal" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="container-brutal-header">
            CREATE NEW CLUB
          </div>
          
          <form onSubmit={createClubForm.handleSubmit(handleCreateClub)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Club Name
              </label>
              <input
                {...createClubForm.register('name', { required: 'Club name is required' })}
                type="text"
                className="w-full px-3 py-2 bg-white/20 border border-gray-300/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter club name"
              />
              {createClubForm.formState.errors.name && (
                <p className="text-red-400 text-sm mt-1">{createClubForm.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                {...createClubForm.register('description')}
                rows={3}
                className="w-full px-3 py-2 bg-white/20 border border-gray-300/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe your gaming club..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Club Passcode
              </label>
              <input
                {...createClubForm.register('passcode', { required: 'Passcode is required' })}
                type="password"
                className="w-full px-3 py-2 bg-white/20 border border-gray-300/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Create a secure passcode"
              />
              {createClubForm.formState.errors.passcode && (
                <p className="text-red-400 text-sm mt-1">{createClubForm.formState.errors.passcode.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={createClubForm.formState.isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {createClubForm.formState.isSubmitting ? 'Creating...' : 'Create Club'}
            </button>
          </form>
          
          <button
            onClick={() => setStep('browse')}
            className="w-full mt-4 text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Clubs
          </button>
        </div>
    </div>
  );
  }

    return null; 
}
