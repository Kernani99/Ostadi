
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useFirebase } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOut, Auth } from 'firebase/auth';

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, auth } = useFirebase(); // Get auth from context
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const publicPaths = ['/login', '/register', '/evaluations-demo'];
    const pathIsPublic = publicPaths.some(p => pathname.startsWith(p));
    
    if (isUserLoading) return; // Wait until user status is resolved

    if (user) { // User is authenticated
      if (!user.emailVerified) {
          // Immediately sign out unverified users trying to access protected pages
          if (!pathIsPublic) {
              signOut(auth as Auth); // Type assertion for safety
              router.push('/login');
              toast({
                  title: 'البريد الإلكتروني غير مفعل',
                  description: 'لقد تم تسجيل خروجك. الرجاء تفعيل حسابك عبر الرابط المرسل إلى بريدك الإلكتروني ثم تسجيل الدخول مجدداً.',
                  variant: 'destructive',
                  duration: 8000,
              });
          }
      } else if (pathIsPublic && !pathname.startsWith('/evaluations-demo')) {
        // Verified user on a public auth page (login/register), redirect to home
        router.push('/');
      }
    } else { // User is not authenticated
      if (!pathIsPublic) {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router, pathname, toast, auth]);

  const publicPaths = ['/login', '/register', '/evaluations-demo'];
  // To prevent flicker, we can show a loading screen while auth state is resolving on protected pages
  if (isUserLoading && !publicPaths.some(p => pathname.startsWith(p))) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>جاري تحميل المستخدم...</p>
      </div>
    );
  }

  return <>{children}</>;
}


interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []); 

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
