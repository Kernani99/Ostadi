'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * يستمع لأخطاء صلاحيات Firestore ويعرض تنبيهاً للمستخدم.
 * سابقاً كان الخطأ يُرمى فيُسقط التطبيق كله ويعرض حمولة الطلب (البريد، المعرّف) على الشاشة؛
 * الآن التفاصيل تُسجَّل في وضع التطوير فقط.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }
      toast({
        title: 'تعذّر تنفيذ العملية',
        description: 'ليست لديك صلاحية الوصول إلى هذه البيانات، أو أن العنصر المطلوب غير موجود.',
        variant: 'destructive',
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, [toast]);

  return null;
}
