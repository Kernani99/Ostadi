import 'server-only';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { firebaseConfig } from '@/firebase/config';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;

// مفاتيح Google العمومية لتوقيع رموز Firebase؛ jose يخزّنها مؤقتاً ويجدّدها عند تدوير المفاتيح.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export type VerifiedUser = { uid: string; email?: string };

/**
 * يتحقق من رمز هوية Firebase (توقيع RS256، المُصدِر، الجمهور، الصلاحية) ويشترط بريداً مفعَّلاً.
 * يُرجع null لأي رمز غير صالح — لا تُسرَّب تفاصيل سبب الرفض للعميل.
 */
export async function verifyFirebaseIdToken(authorization: string | null): Promise<VerifiedUser | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7).trim();
  if (!token || token.length > 4096) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ['RS256'],
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      clockTolerance: 5,
    });
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    if (payload.email_verified !== true) return null;
    return { uid: payload.sub, email: typeof payload.email === 'string' ? payload.email : undefined };
  } catch {
    return null;
  }
}
