import type {
  UserType,
  Department,
  Grade,
  LeaveOfAbsence,
  ReturnPlan,
  StaffDepartment,
} from "@/types/profile";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export const USER_TYPE_OPTIONS: SelectOption<UserType>[] = [
  { value: "student", label: "학생" },
  { value: "staff", label: "교직원" },
];

export const DEPARTMENT_OPTIONS: SelectOption<Department>[] = [
  { value: "software", label: "소프트웨어학부" },
  { value: "ai", label: "인공지능학부" },
];

export const GRADE_OPTIONS: SelectOption<Grade>[] = [
  { value: "1", label: "1학년" },
  { value: "2", label: "2학년" },
  { value: "3", label: "3학년" },
  { value: "4", label: "4학년" },
  { value: "5_or_above", label: "5학년 이상" },
];

export const LEAVE_OF_ABSENCE_OPTIONS: SelectOption<LeaveOfAbsence>[] = [
  { value: "yes", label: "예" },
  { value: "no", label: "아니오" },
  { value: "not_applicable", label: "해당 없음" },
];

export const RETURN_PLAN_OPTIONS: SelectOption<ReturnPlan>[] = [
  { value: "this_semester", label: "이번 학기 복학 예정" },
  { value: "next_semester", label: "다음 학기 복학 예정" },
  { value: "undecided", label: "미정" },
  { value: "not_applicable", label: "해당 없음" },
];

export const STAFF_DEPARTMENT_OPTIONS: SelectOption<StaffDepartment>[] = [
  { value: "student_support", label: "학생지원팀" },
  { value: "academic_affairs", label: "학사팀" },
  { value: "admissions", label: "입학팀" },
  { value: "industry_cooperation", label: "산학협력팀" },
  { value: "international_office", label: "국제교류팀" },
  { value: "general_affairs", label: "총무팀" },
  { value: "other", label: "기타" },
];
