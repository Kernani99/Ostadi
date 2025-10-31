'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, initiateAnonymousSignIn } from '@/firebase'; // Added initiateAnonymousSignIn
import { useAuth } from './provider'; // Added useAuth

interface FirebaseClientProviderProps {
  children: React.Node;
}

function AuthHandler({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  useEffect(() => {
    // Initiate anonymous sign-in when the component mounts and auth is available
    initiateAnonymousSignIn(auth);
  }, [auth]);

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
