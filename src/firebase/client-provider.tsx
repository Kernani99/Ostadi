'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { useUser } from './provider';
import { usePathname, useRouter } from 'next/navigation';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If auth state is done loading and there's no user,
    // and we are not already on the login page, redirect.
    if (!isUserLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  // While loading, we can show a loader or nothing.
  // Or, if we are on the login page, we can show the children immediately.
  if (isUserLoading && pathname !== '/login') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {/* You can replace this with a more sophisticated loading spinner component */}
        <p>جاري تحميل المستخدم...</p>
      </div>
    );
  }
  
  if (!user && pathname !== '/login') {
      // Still loading or about to redirect, don't render children
      return null;
  }

  return <>{children}</>;
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
