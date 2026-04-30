
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileUp, FileDown, ArrowLeft, RefreshCw, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ListConverterPage() {
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedWorkbook, setProcessedWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [extractedCount, setExtractedCount] = useState(0);
    const [cleanLevel, setCleanLevel] = useState(true);
    const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (fileExt !== 'xlsx' && fileExt !== 'xls') {
            setStatus({ type: 'error', message: 'الرجاء رفع ملف إكسيل بصيغة xlsx أو xls فقط.' });
            return;
        }

        setIsProcessing(true);
        setStatus({ type: 'idle', message: 'جاري قراءة ومعالجة الملف...' });
        setProcessedWorkbook(null);

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                
                const allStudents: any[] = [];
                let count = 0;
                
                workbook.SheetNames.forEach(sheetName => {
                    if (sheetName.toLowerCase().includes('worksheet')) return;

                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd" });
                    
                    if (jsonData.length < 8) return;

                    let school = "غير معروف";
                    let level = "غير معروف";

                    // البحث عن المؤسسة والمستوى في الأسطر الأولى
                    for (let j = 0; j < Math.min(10, jsonData.length); j++) {
                        let rowStr = jsonData[j] ? String(jsonData[j][0] || "") : "";
                        
                        if (rowStr.includes("مدرسة") || rowStr.includes("متوسطة") || rowStr.includes("ثانوية")) {
                            school = rowStr.replace('مدرسة', '').trim();
                        } else if (j === 3 && school === "غير معروف" && rowStr.trim() !== "" && !rowStr.includes("وزارة") && !rowStr.includes("مديرية") && !rowStr.includes("الجمهورية")) {
                            school = rowStr.trim();
                        }
                        
                        if (rowStr.includes("الفوج التربوي")) {
                            let levelMatch = rowStr.match(/الفوج التربوي\s*:\s*(.*?)\s+مادة/);
                            if (levelMatch) {
                                level = levelMatch[1].trim();
                                level = level.replace(/\s+/g, ' ');
                            }
                        }
                    }

                    if (cleanLevel) {
                        level = level.replace(/\s*\d+\s*$/, '');
                    }

                    // استخراج التلاميذ ابتداءً من السطر الثامن
                    for (let i = 7; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || row.length === 0) continue;

                        const mat = row[0] ? String(row[0]).trim() : "";
                        if (!mat || mat === 'nan' || mat === 'matricule' || mat === 'رقم التعريف') continue;

                        const lastName = row[1] ? String(row[1]).trim() : "";
                        const firstName = row[2] ? String(row[2]).trim() : "";
                        let dob = row[3] ? String(row[3]).trim() : "";

                        let gender = "ذكر";
                        if (mat.length > 1 && mat[1] === '1') {
                            gender = "أنثى";
                        } else if (mat.length > 1 && mat[1] === '0') {
                            gender = "ذكر";
                        }

                        allStudents.push({
                            'اللقب': lastName,
                            'الإسم': firstName,
                            'تاريخ الميلاد': dob,
                            'المستوى': level,
                            'الجنس': gender,
                            'المؤسسة': school,
                            'الحالة': 'يمارس'
                        });
                        count++;
                    }
                });

                if (count === 0) {
                    setStatus({ type: 'error', message: 'لم يتم العثور على أي تلاميذ في الملف المرفوع. تأكد من أن الملف هو قالب الرقمنة الصحيح.' });
                    setIsProcessing(false);
                    return;
                }

                const newWs = XLSX.utils.json_to_sheet(allStudents);
                newWs['!cols'] = [
                    { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 25 }, { wch: 10 }
                ];

                const newWb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(newWb, newWs, "التلاميذ");

                setProcessedWorkbook(newWb);
                setExtractedCount(count);
                setStatus({ type: 'success', message: `تمت المعالجة بنجاح! تم استخراج وتجهيز بيانات ${count} تلميذ(ة).` });
                setIsProcessing(false);

            } catch (error) {
                console.error(error);
                setStatus({ type: 'error', message: 'حدث خطأ أثناء معالجة الملف. الرجاء التأكد من سلامة الملف.' });
                setIsProcessing(false);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleDownload = () => {
        if (processedWorkbook) {
            XLSX.writeFile(processedWorkbook, "قائمة_كل_التلاميذ_الجاهزة.xlsx");
            toast({ title: "تم التحميل بنجاح" });
        }
    };

    return (
        <div className="container mx-auto max-w-3xl p-4 space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" asChild size="icon" className="rounded-full">
                    <Link href="/students">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold text-primary">محول قوائم الرقمنة</h1>
            </div>

            <Card className="border-2 border-primary/10 shadow-xl overflow-hidden">
                <CardHeader className="bg-primary text-primary-foreground text-center pb-8 pt-10">
                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                        <FileSpreadsheet className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold">محول قوائم التلاميذ</CardTitle>
                    <CardDescription className="text-primary-foreground/80 mt-2 text-base">
                        قم برفع ملف الإكسيل المستخرج من الأرضية الرقمية، وسنقوم بتحويله إلى القائمة المجمعة الجاهزة للرفع إلى التطبيق.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        className="border-4 border-dashed border-muted hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-12 text-center cursor-pointer transition-all group"
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".xlsx, .xls"
                            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                        />
                        <FileUp className="h-16 w-16 text-muted-foreground group-hover:text-primary mx-auto mb-4 transition-colors" />
                        <h3 className="text-xl font-bold text-gray-700">اضغط هنا لاختيار الملف</h3>
                        <p className="text-sm text-muted-foreground mt-2">أو قم بسحب وإفلات الملف هنا (xlsx)</p>
                    </div>

                    <div className="flex items-center gap-4 bg-muted/30 p-5 rounded-xl border border-muted">
                        <Checkbox 
                            id="cleanLevel" 
                            checked={cleanLevel} 
                            onCheckedChange={(checked) => setCleanLevel(!!checked)} 
                            className="h-6 w-6"
                        />
                        <Label htmlFor="cleanLevel" className="text-sm font-medium leading-relaxed cursor-pointer select-none">
                            إزالة أرقام الأفواج من المستوى <br/>
                            <span className="text-xs text-muted-foreground font-normal">(مثال: سيتم كتابة "أولى إبتدائي" بدلاً من "أولى إبتدائي 1")</span>
                        </Label>
                    </div>

                    {status.type !== 'idle' && (
                        <div className={cn(
                            "p-5 rounded-xl flex items-start gap-4 border animate-in fade-in slide-in-from-top-4 duration-300",
                            status.type === 'success' ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                        )}>
                            {status.type === 'success' ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                            ) : (
                                <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
                            )}
                            <div>
                                <p className="font-bold">{status.type === 'success' ? 'تمت المعالجة بنجاح' : 'خطأ في المعالجة'}</p>
                                <p className="text-sm mt-1">{status.message}</p>
                            </div>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="flex flex-col items-center justify-center py-6 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-medium text-primary">جاري معالجة البيانات...</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-gray-50 border-t p-6 flex justify-center">
                    {processedWorkbook ? (
                        <Button 
                            onClick={handleDownload} 
                            size="lg" 
                            className="bg-green-600 hover:bg-green-700 text-white font-bold h-14 px-10 rounded-full shadow-xl hover:scale-105 transition-transform"
                        >
                            <FileDown className="me-2 h-6 w-6" />
                            تحميل القائمة الجاهزة
                        </Button>
                    ) : (
                        <p className="text-sm text-muted-foreground">ارفع ملفاً للبدء</p>
                    )}
                </CardFooter>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
                <p>تنبيه: هذا المحول يعمل على متصفحك فقط، بيانات التلاميذ لا يتم إرسالها لأي خادم خارجي.</p>
            </div>
        </div>
    );
}
