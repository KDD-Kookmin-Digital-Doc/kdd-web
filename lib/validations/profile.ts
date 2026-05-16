import { z } from "zod";

export const basicInfoSchema = z
  .object({
    name: z
      .string()
      .min(1, "이름을 입력해주세요")
      .max(50, "이름은 50자 이하로 입력해주세요"),
    email: z.string().email("올바른 이메일 형식이 아닙니다"),
    userType: z.enum(["student", "staff"], {
      message: "사용자 유형을 선택해주세요",
    }),
    studentId: z.string(),
  })
  .refine(
    (data) => {
      if (data.userType === "student") {
        return data.studentId.trim().length > 0;
      }
      return true;
    },
    { message: "학번을 입력해주세요", path: ["studentId"] }
  )
  .refine(
    (data) => {
      if (data.userType === "student" && data.studentId.trim().length > 0) {
        return /^\d{8,10}$/.test(data.studentId.trim());
      }
      return true;
    },
    { message: "학번은 8~10자리 숫자로 입력해주세요", path: ["studentId"] }
  );

export const studentInfoSchema = z
  .object({
    department: z.enum(["software", "ai"], {
      message: "학과/학부를 선택해주세요",
    }),
    grade: z.enum(["1", "2", "3", "4", "5_or_above"], {
      message: "학년을 선택해주세요",
    }),
    admissionYear: z
      .string()
      .min(1, "입학년도를 입력해주세요")
      .regex(/^\d{4}$/, "입학년도는 4자리 숫자로 입력해주세요")
      .refine(
        (v) => {
          const year = parseInt(v, 10);
          return year >= 2000 && year <= new Date().getFullYear();
        },
        { message: "올바른 입학년도를 입력해주세요" }
      ),
    leaveOfAbsence: z.enum(["yes", "no", "not_applicable"], {
      message: "휴학 여부를 선택해주세요",
    }),
    returnPlan: z.string(),
    additionalInfo: z.string(),
  })
  .refine(
    (data) => {
      if (data.leaveOfAbsence === "yes") {
        return ["this_semester", "next_semester", "undecided", "not_applicable"].includes(
          data.returnPlan
        );
      }
      return true;
    },
    { message: "복학 예정 여부를 선택해주세요", path: ["returnPlan"] }
  );

export const staffInfoSchema = z.object({
  staffDepartment: z.enum(
    [
      "student_support",
      "academic_affairs",
      "admissions",
      "industry_cooperation",
      "international_office",
      "general_affairs",
      "other",
    ],
    { message: "소속 부서를 선택해주세요" }
  ),
  jobDescription: z.string(),
});

export type BasicInfoErrors = Partial<
  Record<"name" | "email" | "userType" | "studentId", string>
>;
export type StudentInfoErrors = Partial<
  Record<
    "department" | "grade" | "admissionYear" | "leaveOfAbsence" | "returnPlan",
    string
  >
>;
export type StaffInfoErrors = Partial<Record<"staffDepartment", string>>;

export function extractErrors<T extends Record<string, string>>(
  result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } }
): T {
  const errors = {} as Record<string, string>;
  if (!result.success && result.error) {
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (key != null && !errors[String(key)]) {
        errors[String(key)] = issue.message;
      }
    }
  }
  return errors as T;
}
