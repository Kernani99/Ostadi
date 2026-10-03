'use client';

import { PageHeader } from "@/components/layout/page-header";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    lastName: z.string().max(200, "النص طويل جداً").optional(),
    firstName: z.string().max(200, "النص طويل جداً").optional(),
    dateOfBirth: z.string().max(200, "النص طويل جداً").optional(),
    placeOfBirth: z.string().max(200, "النص طويل جداً").optional(),
    maritalStatus: z.string().max(200, "النص طويل جداً").optional(),
    address: z.string().max(200, "النص طويل جداً").optional(),
    phoneNumber: z.string().max(200, "النص طويل جداً").optional(),
    email: z.string().email().optional().or(z.literal('')),
    rank: z.string().max(200, "النص طويل جداً").optional(),
    title: z.string().max(200, "النص طويل جداً").optional(),
    appointmentDate: z.string().max(200, "النص طويل جداً").optional(),
    confirmationDate: z.string().max(200, "النص طويل جداً").optional(),
    grade: z.string().max(200, "النص طويل جداً").optional(),
    certificateName: z.string().max(200, "النص طويل جداً").optional(),
    certificateNumber: z.string().max(200, "النص طويل جداً").optional(),
    specialization: z.string().max(200, "النص طويل جداً").optional(),
    issuingInstitution: z.string().max(200, "النص طويل جداً").optional(),
    certificationDate: z.string().max(200, "النص طويل جداً").optional(),
    wilaya: z.string().max(200, "النص طويل جداً").optional(),
    schoolName: z.string().max(200, "النص طويل جداً").optional(),
    schoolYear: z.string().max(200, "النص طويل جداً").optional(),
});

type TechnicalCardFormValues = z.infer<typeof technicalCardSchema>;

const formSections = {
    "معلومات المؤسسة والطباعة": {
        wilaya: "الولاية",
        schoolName: "اسم المدرسة",
        schoolYear: "السنة الدراسية",
    },
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

// Component for the print layout
const PrintView = ({ profileData }: { profileData: TechnicalCardFormValues | null }) => {
    if (!profileData) return null;

    const allFields = Object.entries(formSections).flatMap(([sectionTitle, fields]) => [
        { isHeader: true, title: sectionTitle },
        ...Object.entries(fields).map(([fieldName, fieldLabel]) => ({
            isHeader: false,
            label: fieldLabel,
            value: profileData[fieldName as keyof TechnicalCardFormValues]
        }))
    ]);

    return (
        <div id="print-section" className="hidden print:block font-body bg-white text-black">
            <h1 className="text-center text-lg font-bold mb-4">البطاقة الفنية للأستاذ</h1>
            <table className="w-full border-collapse border border-gray-400">
                <tbody>
                    {allFields.map((item, index) => {
                        if ('title' in item) {
                            return (
                                <tr key={`header-${index}`}>
                                    <td colSpan={2} className="bg-gray-200 p-2 font-bold text-center text-base">{item.title}</td>
                                </tr>
                            );
                        }
                        const displayValue = (item.label?.toLowerCase().includes('date') && item.value) 
                            ? new Date(item.value).toLocaleDateString('fr-CA') 
                            : item.value;
                        return (
                            <tr key={`field-${index}`}>
                                <td className="border border-gray-300 p-2 font-semibold w-1/3">{item.label}</td>
                                <td className="border border-gray-300 p-2">{displayValue || ''}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


export default function TechnicalCardPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    
    const profileDocRef = useMemoFirebase(() => user ? doc(firestore, 'professor_profile', user.uid) : null, [firestore, user]);
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
        if (!profileDocRef) {
            toast({ title: "خطأ", description: "لا يمكن حفظ البيانات. المستخدم غير معروف.", variant: "destructive" });
            return;
        }
        const sanitizedData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, value === undefined ? '' : value])
        );

        setDocumentNonBlocking(profileDocRef, sanitizedData, { merge: true });
        toast({
            title: "تم الحفظ بنجاح",
            description: "تم تحديث بيانات البطاقة الفنية.",
            variant: "success",
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
        <div className="space-y-6">
             <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1cm;
                    }
                    body {
                        background-color: #fff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #print-section {
                        display: block !important;
                    }
                    table {
                        font-size: 10pt; /* Smaller font for printing */
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <div className="no-print">
                <PageHeader title="البطاقة الفنية للأستاذ" description="بياناتك المهنية كما تظهر في الوثائق المطبوعة." />
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
                        {Object.entries(formSections).map(([sectionTitle, fields]) => (
                            <Card key={sectionTitle} className="shadow-md">
                                <CardHeader>
                                    <CardTitle>{sectionTitle}</CardTitle>
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

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={handlePrint}>
                                <Printer />
                                طباعة
                            </Button>
                            <Button type="submit">
                                {form.formState.isSubmitting ? <Loader2 className="animate-spin me-2" /> : null}
                                حفظ المعلومات
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
            
            <PrintView profileData={profileData} />
        </div>
    );
}
