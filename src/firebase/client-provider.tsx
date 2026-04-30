
'use client';

import React, { useMemo, useEffect } from 'react';
import { FirebaseProvider, useFirebase } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOut, Auth } from 'firebase/auth';
import { Loader2, GraduationCap } from "lucide-react";

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, auth } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const publicPaths = ['/login', '/register', '/evaluations-demo'];
    const pathIsPublic = publicPaths.some(p => pathname.startsWith(p));
    
    if (isUserLoading) return;

    if (user) {
      if (!user.emailVerified) {
          if (!pathIsPublic) {
              signOut(auth as Auth);
              router.push('/login');
              toast({
                  title: 'تنبيه: الحساب يتطلب التفعيل',
                  description: 'لقد تم تسجيل خروجك لأن حسابك لم يتم تفعيله بعد. يرجى التحقق من بريدك الإلكتروني والنقر على رابط التفعيل، ثم حاول تسجيل الدخول مرة أخرى.',
                  variant: 'destructive',
                  duration: 10000,
              });
          }
      } else if (pathIsPublic && !pathname.startsWith('/evaluations-demo')) {
        router.push('/');
      }
    } else {
      if (!pathIsPublic) {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router, pathname, toast, auth]);

  const publicPaths = ['/login', '/register', '/evaluations-demo'];
  const isAuthPage = publicPaths.some(p => pathname.startsWith(p));

  // Show a professional loading screen while resolving auth status on non-public pages
  if (isUserLoading && !isAuthPage) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="bg-primary p-4 rounded-full shadow-lg">
                <GraduationCap className="h-12 w-12 text-white" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>جاري التحقق من الهوية...</span>
            </div>
            <p className="text-muted-foreground text-sm">فضلاً انتظر لحظات</p>
        </div>
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
