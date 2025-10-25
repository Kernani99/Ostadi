// This component renders a raw HTML string provided by the user.
// It is intended to be a self-contained page for printing.

export default function PrintAnnualAttendancePage() {
  const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>قائمة الطلبة التفاعلية</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    
    <style>
        /* إعدادات الصفحة للطباعة */
        @page {
            size: A4 landscape; /* تحديد حجم الصفحة A4 بالعرض */
            margin: 1cm;
        }

        body {
            font-family: 'Cairo', sans-serif; /* تطبيق خط القاهرة */
            direction: rtl;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }

        h1 {
            text-align: center;
            color: #333;
        }

        /* --- قسم رفع الملفات --- */
        .upload-section {
            background-color: #fff;
            border: 2px dashed #007bff;
            border-radius: 8px;
            padding: 20px;
            margin: 20px auto;
            max-width: 800px;
            text-align: center;
        }

        .upload-section input[type="file"] {
            border: 1px solid #ccc;
            display: inline-block;
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 4px;
        }

        .upload-section button {
            font-family: 'Cairo', sans-serif;
            font-size: 16px;
            font-weight: 600;
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            transition: background-color 0.3s;
        }

        .upload-section button:hover {
            background-color: #0056b3;
        }

        .container {
            width: 100%;
            margin: 0;
            overflow-x: auto; /* لإضافة تمرير أفقي على الشاشات */
        }

        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10pt;
            background-color: #fff; /* خلفية بيضاء للجدول */
        }

        th, td {
            border: 1px solid #333;
            padding: 5px;
            text-align: center;
            height: 28px;
            overflow: hidden;
            white-space: nowrap;
        }

        /* تنسيق رأس الجدول */
        thead th {
            background-color: #e0e0e0;
            font-weight: 700;
            vertical-align: middle;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        thead tr:last-child th {
            background-color: #f0f0f0;
            font-weight: 400;
            font-size: 9pt;
            width: 2.5%;
        }

        /* تنسيق أعمدة الاسم واللقب */
        th:nth-child(1), th:nth-child(2),
        td:nth-child(1), td:nth-child(2) {
            text-align: right;
            font-weight: 600;
            width: 10%;
            padding-right: 8px;
        }

        tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        /* إعدادات خاصة بالطباعة */
        @media print {
            body {
                background-color: #fff;
                margin: 0;
                padding: 0;
            }
            h1, .upload-section {
                display: none; /* إخفاء قسم الرفع وعنوان الصفحة عند الطباعة */
            }
            .container {
                overflow-x: visible;
            }
            th, td {
                border: 1px solid #000 !important;
            }
            thead th {
                 background-color: #e0e0e0 !important;
            }
            thead tr:last-child th {
                 background-color: #f0f0f0 !important;
            }
            tbody tr:nth-child(even) {
                background-color: #f9f9f9 !important;
            }
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>

    <h1>قائمة متابعة الطلبة</h1>

    <div class="upload-section">
        <label for="excelFile">اختر ملف إكسل (xls أو xlsx): </label>
        <input type="file" id="excelFile" accept=".xls, .xlsx">
        <button id="uploadButton">رفع القائمة</button>
    </div>

    <div class="container">
        <table>
            <thead>
                <tr>
                    <th rowspan="2">اللقب</th>
                    <th rowspan="2">الاسم</th>
                    <th colspan="5">نوفمبر</th>
                    <th colspan="5">ديسمبر</th>
                    <th colspan="5">جانفي</th>
                    <th colspan="5">فيفري</th>
                    <th colspan="5">مارس</th>
                    <th colspan="5">أفريل</th>
                    <th colspan="5">ماي</th>
                    <th colspan="5">جوان</th>
                </tr>
                <tr>
                    <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                </tr>
            </thead>
            <tbody id="studentListBody">
                </tbody>
        </table>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

    <script>
        document.getElementById('uploadButton').addEventListener('click', function() {
            const fileInput = document.getElementById('excelFile');
            const file = fileInput.files[0];

            if (!file) {
                alert("الرجاء اختيار ملف إكسل أولاً.");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const data = event.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                
                // افتراض أن البيانات في الشيت الأول
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // تحويل الشيت إلى مصفوفة من المصفوفات (كل صف عبارة عن مصفوفة)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const tableBody = document.getElementById('studentListBody');
                // مسح القائمة القديمة قبل إضافة الجديدة
                tableBody.innerHTML = ''; 

                // إنشاء 40 خانة فارغة للأشهر
                const emptyCells = '<td></td>'.repeat(40); // 8 أشهر * 5 خانات

                // المرور على كل صف في بيانات الإكسل
                jsonData.forEach(row => {
                    const lastName = row[0] || '';  // اللقب من العمود A
                    const firstName = row[1] || ''; // الاسم من العمود B

                    // التأكد من أن الصف يحتوي على بيانات
                    if (lastName || firstName) {
                        const tr = document.createElement('tr');
                        tr.innerHTML = \`
                            <td>\${lastName}</td>
                            <td>\${firstName}</td>
                            \${emptyCells}
                        \`;
                        tableBody.appendChild(tr);
                    }
                });
            };
            
            reader.readAsBinaryString(file);
        });
    </script>

</body>
</html>
  `;
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}
