'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-base)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <Loading text="LOADING..." />
      </div>
    );
  }

  const navigation = [
    { name: 'DASHBOARD', href: '/dashboard' },
    { name: 'MY QUEUE', href: '/dashboard/queue' },
    { name: 'CLUB MEMBERS', href: '/dashboard/members' },
    { name: 'ROTATIONS', href: '/dashboard/rotations' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: 'Fira Code, monospace'
    }}>
      {/* Header Navigation */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '2px solid var(--border)',
        padding: '16px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              margin: '0',
              textTransform: 'uppercase'
            }}>
              vgbook.club
            </h1>

          </div>
          
          <nav style={{ display: 'flex', gap: '0' }}>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isActive ? 'var(--text-primary)' : 'transparent',
                    color: isActive ? 'var(--bg-base)' : 'var(--text-primary)',
                    border: '2px solid var(--border)',
                    marginLeft: '-2px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--error)',
                color: 'var(--bg-base)',
                border: '2px solid var(--error)',
                marginLeft: '16px',
                fontWeight: 'bold',
                fontSize: '12px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'Fira Code, monospace'
              }}
            >
              LOGOUT
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '24px 16px' 
      }}>
        {children}
      </div>
    </div>
  );
}