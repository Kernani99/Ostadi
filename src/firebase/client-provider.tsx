'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { useUser } from './provider';
import { usePathname, useRouter } from 'next/navigation';

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Define public paths that don't require authentication
    const publicPaths = ['/login', '/evaluations-demo'];

    // If auth state is done loading, there's no user, and we are not on a public page, redirect to login.
    if (!isUserLoading && !user && !publicPaths.some(p => pathname.startsWith(p))) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  const isPublicPage = ['/login', '/evaluations-demo'].some(p => pathname.startsWith(p));

  // While loading auth state, show a loader for protected pages
  if (isUserLoading && !isPublicPage) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>جاري تحميل المستخدم...</p>
      </div>
    );
  }
  
  // If no user and it's a protected page, don't render children (as it will redirect)
  if (!user && !isPublicPage) {
      return null;
  }

  // Render children for public pages or for authenticated users on protected pages
  return <>{children}</>;
}

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <AuthHandler>
        {children}
      </AuthHandler>
    </FirebaseProvider>
  );
}
