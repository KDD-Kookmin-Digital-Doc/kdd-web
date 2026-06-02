export type UserType = "student" | "staff";

export type LeaveOfAbsence = "yes" | "no" | "not_applicable";

export type ReturnPlan =
  | "this_semester"
  | "next_semester"
  | "undecided"
  | "not_applicable";

export type Department = "software" | "ai";

export type Grade = "1" | "2" | "3" | "4" | "5_or_above";

export type StaffDepartment =
  | "student_support"
  | "academic_affairs"
  | "admissions"
  | "industry_cooperation"
  | "international_office"
  | "general_affairs"
  | "other";

/** Step 1: Basic info fields */
export interface BasicInfoData {
  name: string;
  email: string;
  userType: UserType | "";
  studentId: string;
}

/** Step 2 (student): Academic info fields */
export interface StudentInfoData {
  department: Department | "";
  grade: Grade | "";
  admissionYear: string;
  leaveOfAbsence: LeaveOfAbsence | "";
  returnPlan: ReturnPlan | "";
  additionalInfo: string;
}

/** Step 2 (staff): Work info fields */
export interface StaffInfoData {
  staffDepartment: StaffDepartment | "";
  jobDescription: string;
}

/** Combined profile form data */
export interface ProfileFormData {
  basicInfo: BasicInfoData;
  studentInfo: StudentInfoData;
  staffInfo: StaffInfoData;
}
