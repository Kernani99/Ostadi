'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  password: z.string().min(6, { message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleAuthAction = async (data: LoginFormValues, action: 'login' | 'signup') => {
    setIsLoading(true);
    try {
      let userCredential;
      if (action === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك مرة أخرى.`,
        });
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "تم تسجيل دخولك تلقائياً.",
        });
      }
      router.push('/'); // Redirect to the main page on success
    } catch (error: any) {
      console.error(error);
      // More specific error messages
      let description = "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      } else if (error.code === 'auth/email-already-in-use') {
        description = "هذا البريد الإلكتروني مستخدم بالفعل. حاول تسجيل الدخول.";
      }
      toast({
        title: action === 'login' ? "فشل تسجيل الدخول" : "فشل إنشاء الحساب",
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>
            أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:gap-2 pt-2">
                 <Button onClick={form.handleSubmit((data) => handleAuthAction(data, 'login'))} disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    تسجيل الدخول
                </Button>
                <Button onClick={form.handleSubmit((data) => handleAuthAction(data, 'signup'))} variant="secondary" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    إنشاء حساب جديد
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
