
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowLeft, Mail, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AlgerianFlagIcon = () => (
    <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center animate-pulse flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" className="h-full w-auto">
            <rect width="1200" height="800" fill="#fff"/>
            <rect width="600" height="800" fill="#006233"/>
            <g transform="translate(600,400)">
                <path d="M 0 -150 A 150 150 0 0 0 0 150 A 120 120 0 0 1 0 -150" fill="#d21034"/>
                <g transform="rotate(18)">
                    <path d="M 0 -70 L 22 -22 L 70 0 L 22 22 L 0 70 L -22 22 L -70 0 L -22 -22 Z" fill="#d21034"/>
                </g>
            </g>
        </svg>
    </div>
);


export default function LoginPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoginError(null);
    if (!email || !password) {
      setLoginError("الرجاء إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setIsLoading(false);
      let errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات المدخلة.";
       switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = "صيغة البريد الإلكتروني غير صحيحة.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "تم حظر الوصول مؤقتًا بسبب كثرة المحاولات الفاشلة.";
          break;
        case 'auth/user-disabled':
          errorMessage = "تم تعطيل هذا الحساب. يرجى التواصل مع الإدارة.";
          break;
      }
      setLoginError(errorMessage);
      toast({
        title: "فشل تسجيل الدخول",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-primary text-primary-foreground">
         <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-center">
            <AlgerianFlagIcon />
           <h1 className="text-4xl font-bold mt-8">
             المنصة الإلكترونية لإدارة التربية البدنية
           </h1>
           <p className="text-lg mt-4 text-primary-foreground/80">
             نظام ذكي متكامل لتنظيم وتسيير شؤون التربية البدنية والرياضية في المدارس الابتدائية.
           </p>
         </div>
      </div>
      <div className="flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md space-y-6">
            <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-3 py-1 text-sm mb-4">
                   <ShieldCheck className="h-4 w-4" />
                   بوابة الدخول الآمنة
                </div>
                <h1 className="text-3xl font-bold text-gray-900">تسجيل الدخول</h1>
                <p className="text-muted-foreground mt-2">
                    أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم.
                </p>
            </div>

            {loginError && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ في الدخول</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
          
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                   <Input 
                    id="email" 
                    type="email" 
                    placeholder="email@example.com" 
                    required 
                    value={email} 
                    onChange={(e) => { setEmail(e.target.value); setLoginError(null); }} 
                    className="ps-10" 
                    disabled={isLoading}
                   />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">كلمة المرور</Label>
                   <Link href="#" className="text-sm text-primary hover:underline">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                   <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => { setPassword(e.target.value); setLoginError(null); }} 
                    className="ps-10" 
                    disabled={isLoading}
                   />
                </div>
              </div>
            </div>

            <Button onClick={handleLogin} disabled={isLoading} className="w-full bg-primary text-white h-12 text-base">
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-5 w-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  دخول للنظام
                  <ArrowLeft className="ms-2" />
                </>
              )}
            </Button>
            
            <div className="mt-6 p-4 rounded-lg bg-accent/50 border border-accent">
                <div className="flex flex-col items-center text-center">
                    <h3 className="font-semibold text-accent-foreground">لا تملك حساب؟</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        نوفر لك تسييراً متكاملاً لمدرستك مجاناً بالكامل.
                    </p>
                    <Link href="/register" legacyBehavior>
                        <a className="w-full">
                           <Button variant="outline" className="w-full bg-white hover:bg-gray-50 border-gray-300" disabled={isLoading}>
                            إنشاء حساب جديد
                          </Button>
                        </a>
                    </Link>
                </div>
            </div>
             <p className="px-8 text-center text-sm text-muted-foreground">
              تطوير وبرمجة: قرناني عبد الحليم
            </p>
        </div>
      </div>
    </div>
  )
}
