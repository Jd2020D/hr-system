import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const Logo = ({ className = '', showText = false, size = 'md', onClick }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  };

  const LogoContent = () => (
    <div 
      className={`flex items-center gap-3 ${className}`}
      onClick={onClick}
    >
      <img 
        src="/logo.svg" 
        alt="ORAPEX Logo" 
        className={sizeClasses[size]}
      />
      {showText && (
        <span className="text-xl font-bold">
          <span className="text-red-600">ORA</span>
          <span className="text-black">PEX</span>
        </span>
      )}
    </div>
  );

  if (onClick) {
    return <LogoContent />;
  }

  return (
    <Link to="/dashboard">
      <LogoContent />
    </Link>
  );
};

export default Logo;
