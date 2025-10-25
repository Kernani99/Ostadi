# **App Name**: STAPS Manager

## Core Features:

- Dashboard: Display key statistics including the number of institutions, total students, number of males, number of females, and total number of departments.
- Student Management: Enable the creation, modification, deletion, and import/export of student records with a field for gender to support statistics.
- Department Management: Enable the creation and management of departments, linking each department to a specific institution. Includes a list of students in each department.
- Attendance Tracking: Provide a quick interface to select a department and record attendance/absence for students, including the type of absence (excused, unexcused, late).
- Reporting and Statistics: Generate detailed reports on absences and grades, filterable by institution, department, or student. Includes print functionality for attendance lists, grade sheets, and individual student report cards.
- Settings: Manage institutions, evaluation criteria, import/export settings, and data reset options with confirmation modals.
- Dynamic Group Management: Generate random workgroups or divide the department by certain features. If students are underperforming, the app will make a suggestion, based on the student records stored in Firebase, to promote an exchange of learning that will raise overall group scores. App uses the LLM as a tool, in order to find optimal division of students across groups.

## Style Guidelines:

- Primary color: A warm blue (#3498DB) to convey trust and professionalism.
- Background color: A light, desaturated blue (#ECF0F1) for a clean, modern look.
- Accent color: Orange (#E67E22) to highlight key actions and information.
- Body and headline font: 'Cairo' (sans-serif) as requested by the user. Note: currently only Google Fonts are supported.
- Full RTL (right-to-left) support in all interfaces.
- Responsive and clear icons that reflect the function of each feature.
- Subtle transitions and animations to enhance user experience.