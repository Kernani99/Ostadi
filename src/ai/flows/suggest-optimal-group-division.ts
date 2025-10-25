'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting optimal group divisions for physical education activities.
 *
 * It analyzes student data to create groups that maximize learning and engagement.
 *
 * @exports suggestOptimalGroupDivision - An async function that suggests optimal group divisions based on student data.
 * @exports SuggestOptimalGroupDivisionInput - The input type for the suggestOptimalGroupDivision function.
 * @exports SuggestOptimalGroupDivisionOutput - The output type for the suggestOptimalGroupDivision function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const SuggestOptimalGroupDivisionInputSchema = z.object({
  departmentName: z.string().describe('The name of the department.'),
  studentData: z.array(
    z.object({
      studentId: z.string().describe('Unique identifier for the student'),
      performanceScore: z.number().describe('A numerical score representing the student\'s performance'),
      attendanceRate: z.number().describe('The student\'s attendance rate (0-1)'),
      gender: z.enum(['male', 'female']).describe('The student\'s gender'),
      otherFactors: z.string().optional().describe('Other relevant factors about the student'),
    })
  ).describe('Array of student data objects.'),
  numberOfGroups: z.number().int().positive().describe('The number of groups to divide the students into.'),
});

export type SuggestOptimalGroupDivisionInput = z.infer<typeof SuggestOptimalGroupDivisionInputSchema>;

// Define the output schema
const SuggestOptimalGroupDivisionOutputSchema = z.object({
  groupDivisions: z.array(
    z.array(z.string().describe('Student ID'))
  ).describe('Array of group divisions, each containing an array of student IDs.'),
  reasoning: z.string().describe('Explanation of why the groups were divided this way'),
});

export type SuggestOptimalGroupDivisionOutput = z.infer<typeof SuggestOptimalGroupDivisionOutputSchema>;

// Define the tool
const analyzeStudentData = ai.defineTool({
  name: 'analyzeStudentData',
  description: 'Analyzes student data and suggests optimal group divisions based on performance, attendance, gender and other relevant factors.',
  inputSchema: SuggestOptimalGroupDivisionInputSchema,
  outputSchema: SuggestOptimalGroupDivisionOutputSchema,
},async (input) => {
    // Placeholder for actual analysis logic. In the actual implementation,
    // this function would use an algorithm or potentially another LLM call
    // to analyze the student data and determine the optimal group divisions.
    // The goal is to create balanced groups considering performance, attendance, and gender.
    const numberOfGroups = input.numberOfGroups;
    const studentData = input.studentData;

    // Calculate average performance score
    const averagePerformance = studentData.reduce((sum, student) => sum + student.performanceScore, 0) / studentData.length;

    // Separate students into high and low performers
    const highPerformers = studentData.filter(student => student.performanceScore >= averagePerformance);
    const lowPerformers = studentData.filter(student => student.performanceScore < averagePerformance);

    const groupDivisions: string[][] = Array.from({length: numberOfGroups}, () => []);

    let highIndex = 0;
    let lowIndex = 0;

    // Distribute students into groups, alternating between high and low performers
    for (let i = 0; i < studentData.length; i++) {
      const groupIndex = i % numberOfGroups;
      if (i % 2 === 0 && highIndex < highPerformers.length) {
        groupDivisions[groupIndex].push(highPerformers[highIndex].studentId);
        highIndex++;
      } else if (lowIndex < lowPerformers.length) {
        groupDivisions[groupIndex].push(lowPerformers[lowIndex].studentId);
        lowIndex++;
      } else if (highIndex < highPerformers.length) {
          groupDivisions[groupIndex].push(highPerformers[highIndex].studentId);
          highIndex++;
      }
    }

    return {
      groupDivisions,
      reasoning: 'Students were divided into groups balancing high and low performance scores to maximize learning and engagement.',
    };
  }
);

// Define the prompt
const suggestOptimalGroupDivisionPrompt = ai.definePrompt({
  name: 'suggestOptimalGroupDivisionPrompt',
  input: {schema: SuggestOptimalGroupDivisionInputSchema},
  output: {schema: SuggestOptimalGroupDivisionOutputSchema},
  tools: [analyzeStudentData],
  prompt: `You are a helpful AI assistant designed to suggest optimal group divisions for physical education activities.

  The user will provide student data, including performance scores, attendance rates, gender and other relevant factors. You will also be given the desired number of groups.

  Your goal is to analyze the data and suggest group divisions that maximize learning and engagement within each group. Consider balancing the groups based on performance, attendance, and gender.

  Use the analyzeStudentData tool to analyze the student data and suggest the group divisions.

  Here is the department name: {{{departmentName}}}
  Here is the student data: {{{JSON.stringify(studentData)}}}
  Here is the number of groups: {{{numberOfGroups}}}

  Return the group divisions in the format: {groupDivisions: [ [studentId1, studentId2], [studentId3, studentId4] ], reasoning: 'Explanation of why the groups were divided this way'}
  `,
});


// Define the flow
const suggestOptimalGroupDivisionFlow = ai.defineFlow(
  {
    name: 'suggestOptimalGroupDivisionFlow',
    inputSchema: SuggestOptimalGroupDivisionInputSchema,
    outputSchema: SuggestOptimalGroupDivisionOutputSchema,
  },
  async input => {
    const {output} = await suggestOptimalGroupDivisionPrompt(input);
    return output!;
  }
);

/**
 * Suggests optimal group divisions for physical education activities based on student data.
 * @param input - The input data for suggesting group divisions.
 * @returns A promise that resolves to the suggested group divisions.
 */
export async function suggestOptimalGroupDivision(input: SuggestOptimalGroupDivisionInput): Promise<SuggestOptimalGroupDivisionOutput> {
  return suggestOptimalGroupDivisionFlow(input);
}
