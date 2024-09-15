'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const withAuth = (WrappedComponent: React.ComponentType) => {
  const AuthenticatedComponent = () => {
    const router = useRouter();

    useEffect(() => {
      const token = document.cookie.includes('token'); // Check if the token is present

      if (!token) {
        router.push('/login'); // Redirect to login if not authenticated
      }
    }, [router]);

    // If token is present, render the wrapped component
    return <WrappedComponent />;
  };

  return AuthenticatedComponent;
};

export default withAuth;
