'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from "firebase/firestore";
import { useEffect } from "react";
import { useMemoFirebase } from "@/firebase/provider";
import { Loader2, Printer } from "lucide-react";

const technicalCardSchema = z.object({
    lastName: z.string().optional(),
    firstName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    placeOfBirth: z.string().optional(),
    maritalStatus: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    rank: z.string().optional(),
    title: z.string().optional(),
    appointmentDate: z.string().optional(),
    confirmationDate: z.string().optional(),
    grade: z.string().optional(),
    certificateName: z.string().optional(),
    certificateNumber: z.string().optional(),
    specialization: z.string().optional(),
    issuingInstitution: z.string().optional(),
    certificationDate: z.string().optional(),
});

type TechnicalCardFormValues = z.infer<typeof technicalCardSchema>;

const formSections = {
    "البيانات الشخصية": {
        lastName: "اللقب",
        firstName: "الإسم",
        dateOfBirth: "تاريخ الميلاد",
        placeOfBirth: "مكان الميلاد",
        maritalStatus: "الحالة العائلية",
        address: "العنوان الشخصي",
        phoneNumber: "رقم الهاتف",
        email: "البريد الإلكتروني",
    },
    "المعلومات الإدارية": {
        rank: "الرتبة",
        title: "الصفة",
        appointmentDate: "تاريخ التعيين",
        confirmationDate: "تاريخ الترسيم",
        grade: "الدرجة",
    },
    "الشهادات والمؤهلات": {
        certificateName: "مسمى الشهادة",
        certificateNumber: "رقم الشهادة",
        specialization: "التخصص",
        issuingInstitution: "المؤسسة المسلمة للشهادة",
        certificationDate: "تاريخ الحصول على الشهادة",
    },
};

export default function TechnicalCardPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    
    // Using 'main_profile' as a fixed ID for the single professor profile
    const profileDocRef = useMemoFirebase(() => doc(firestore, 'professor_profile', 'main_profile'), [firestore]);
    const { data: profileData, isLoading: isLoadingData } = useDoc<TechnicalCardFormValues>(profileDocRef);

    const form = useForm<TechnicalCardFormValues>({
        resolver: zodResolver(technicalCardSchema),
        defaultValues: {},
    });

    useEffect(() => {
        if (profileData) {
            form.reset(profileData);
        }
    }, [profileData, form]);

    function onSubmit(data: TechnicalCardFormValues) {
        setDocumentNonBlocking(profileDocRef, data, { merge: true });
        toast({
            title: "تم الحفظ بنجاح",
            description: "تم تحديث بيانات البطاقة الفنية.",
        });
    }

    const handlePrint = () => {
        window.print();
    }

    if (isLoadingData) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ms-2">جاري تحميل البيانات...</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4">
             <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-section, #print-section * {
                        visibility: visible;
                    }
                    #print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        right: 0;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>

            <div className="flex flex-col items-center gap-2 mb-6 no-print">
                <h1 className="font-bold text-3xl text-center text-primary relative">
                البطاقة الفنية للأستاذ
                <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
                </h1>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="print-section">
                     {Object.entries(formSections).map(([sectionTitle, fields]) => (
                        <Card key={sectionTitle} className="shadow-md">
                            <CardHeader>
                                <CardTitle className="text-primary">{sectionTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.entries(fields).map(([fieldName, fieldLabel]) => (
                                    <FormField
                                        key={fieldName}
                                        control={form.control}
                                        name={fieldName as keyof TechnicalCardFormValues}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{fieldLabel}</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder={fieldLabel} {...field} 
                                                        type={fieldName.toLowerCase().includes('date') ? 'date' : fieldName === 'email' ? 'email' : 'text'}
                                                        value={field.value ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex justify-end gap-4 no-print">
                        <Button type="button" variant="outline" onClick={handlePrint}>
                            <Printer className="me-2" />
                            طباعة
                        </Button>
                        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                            {form.formState.isSubmitting ? <Loader2 className="animate-spin me-2" /> : null}
                            حفظ المعلومات
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
