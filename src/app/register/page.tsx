
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowLeft, Mail, Lock, User, Briefcase, MapPin, ShieldCheck, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebase } from "@/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

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

const wilayas = [ "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "Méniaa" ];

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !fullName || !rank || !wilaya) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء ملء جميع الحقول المطلوبة.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Split full name into first and last name
      const nameParts = fullName.trim().split(/\s+/);
      const lastName = nameParts.pop() || '';
      const firstName = nameParts.join(' ') || '';
      
      await setDoc(doc(firestore, "professor_profile", user.uid), {
        firstName,
        lastName,
        rank,
        wilaya,
        email: user.email,
      }, { merge: true });

      await sendEmailVerification(user);

      toast({
        title: "تم التسجيل بنجاح! خطوة أخيرة...",
        description: "تم إرسال رابط التفعيل إلى بريدك الإلكتروني. الرجاء التحقق منه لتفعيل حسابك قبل تسجيل الدخول.",
        duration: 9000,
      });

      router.push("/login");
    } catch (error: any) {
      let description = "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          description = "هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد آخر أو تسجيل الدخول.";
          break;
        case 'auth/weak-password':
          description = "كلمة المرور ضعيفة جدًا. يجب أن تتكون من 6 أحرف على الأقل.";
          break;
        case 'auth/invalid-email':
          description = "صيغة البريد الإلكتروني غير صحيحة. يرجى التأكد من إدخال بريد إلكتروني صالح.";
          break;
        default:
          description = "حدث خطأ غير معروف. يرجى المحاولة مرة أخرى.";
          console.error("Registration Error:", error); // Log the full error for debugging
      }
      toast({
        title: "فشل إنشاء الحساب",
        description: description,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-primary text-primary-foreground">
         <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-center">
            <AlgerianFlagIcon />
           <h1 className="text-4xl font-bold mt-8">
             انضم إلى منصة إدارة التربية البدنية
           </h1>
           <p className="text-lg mt-4 text-primary-foreground/80">
             أدوات ذكية وموارد شاملة بين يديك لتسهيل مهامك اليومية كأستاذ للتربية البدنية والرياضية.
           </p>
         </div>
      </div>
       <div className="flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md space-y-6">
            <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-3 py-1 text-sm mb-4">
                   <UserPlus className="h-4 w-4" />
                   إنشاء حساب جديد
                </div>
                <h1 className="text-3xl font-bold text-gray-900">مرحباً بك</h1>
                <p className="text-muted-foreground mt-2">
                    املأ البيانات التالية لإنشاء حسابك والانطلاق نحو تجربة مميزة.
                </p>
            </div>
          
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="fullName">الاسم الكامل (اللقب والإسم)</Label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input id="fullName" placeholder="مثال: قرناني عبد الحليم" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="ps-10" /></div>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="rank">الصفة</Label>
                  <Select onValueChange={setRank} value={rank}>
                      <SelectTrigger id="rank" className="h-12"><SelectValue placeholder="اختر الصفة" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="مرسم">مرسم</SelectItem>
                          <SelectItem value="متربص">متربص</SelectItem>
                          <SelectItem value="متعاقد">متعاقد</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="wilaya">الولاية</Label>
                   <Select onValueChange={setWilaya} value={wilaya}>
                      <SelectTrigger id="wilaya" className="h-12"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                      <SelectContent>
                          {wilayas.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
               <div className="col-span-2 space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input id="email" type="email" placeholder="email@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="ps-10" /></div>
              </div>
               <div className="col-span-2 space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="ps-10" /></div>
              </div>
            </div>

            <Button onClick={handleRegister} disabled={isLoading} className="w-full bg-primary text-white h-12 text-base">
              {isLoading ? <Loader2 className="animate-spin" /> : "إنشاء الحساب"}
              <ArrowLeft className="ms-2" />
            </Button>
            
             <p className="px-8 text-center text-sm text-muted-foreground">
              بالنقر على "إنشاء الحساب"، أنت توافق على <Link href="#" className="underline">شروط الخدمة</Link> و <Link href="#" className="underline">سياسة الخصوصية</Link>.
            </p>
            
            <div className="text-center text-sm">
                لديك حساب بالفعل؟ <Link href="/login" className="font-semibold text-primary hover:underline">سجل الدخول</Link>
            </div>
        </div>
      </div>
    </div>
  )
}
