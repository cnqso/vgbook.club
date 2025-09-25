import Image from 'next/image';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function Loading({ 
  size = 'md', 
  text, 
  className = '' 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-64 h-64', 
    lg: 'w-64 h-64'
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    fontFamily: 'Fira Code, monospace',
    color: 'var(--text-primary)'
  };

  return (
    <div style={containerStyle} className={className}>
      <Image
        src="/loading.gif"
        alt="Loading..."
        width={256}
        height={256}
        className={sizeClasses[size]}
        style={{ 
          imageRendering: 'pixelated'
        }}
        unoptimized
      />
      {text && (
        <p style={{ 
          fontSize: '12px', 
          textTransform: 'uppercase', 
          fontWeight: 'bold',
          margin: 0,
          textAlign: 'center'
        }}>
          {text}
        </p>
      )}
    </div>
  );
}
