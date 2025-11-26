
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import Link from "next/link";


export default function PedagogicalBookPage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          الدفتر البيداغوجي
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/professor-documents/pedagogical-book/sports-equipment">
          <Card className="hover:shadow-lg hover:border-primary transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Wrench className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle>سجل العتاد الرياضي</CardTitle>
                  <CardDescription>إدارة وتنظيم قائمة العتاد الرياضي المتوفر.</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
        {/* Add other pedagogical book sections here in the future */}
      </div>

    </div>
  );
}
