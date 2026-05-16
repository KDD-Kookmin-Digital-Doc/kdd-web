"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useChatUsage } from "@/hooks/useChatUsage";
import { updateMyInfo } from "@/lib/api/services/user.service";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, ERROR_MESSAGES } from "@/lib/api/errors";
import { resetMyProfile } from "@/lib/api/services/admin.service";
import {
  studentSettingsSchema,
  staffSettingsSchema,
  sanitizeName,
  extractErrors,
  type StudentSettingsErrors,
  type StaffSettingsErrors,
} from "@/lib/validations/settings";
import { cn } from "@/lib/utils";

// ── 상수 ───────────────────────────────────────────────────────

const ACADEMIC_STATUS_OPTIONS = [
  { value: "enrolled", label: "재학생" },
  { value: "on_leave", label: "휴학생" },
  { value: "returning", label: "복학생" },
] as const;

const DEPARTMENT_OPTIONS = [
  { value: "software", label: "소프트웨어학부" },
  { value: "ai", label: "인공지능학부" },
] as const;

const GRADE_OPTIONS = [
  { value: 1, label: "1학년" },
  { value: 2, label: "2학년" },
  { value: 3, label: "3학년" },
  { value: 4, label: "4학년" },
] as const;

const STAFF_DEPARTMENT_OPTIONS = [
  { value: "student_support", label: "학생지원팀" },
  { value: "academic_affairs", label: "학사팀" },
  { value: "admissions", label: "입학팀" },
  { value: "industry_cooperation", label: "산학협력팀" },
  { value: "international_office", label: "국제교류팀" },
  { value: "general_affairs", label: "총무팀" },
  { value: "other", label: "기타" },
] as const;

// ── 폼 필드 스타일 ─────────────────────────────────────────────

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

const errorClass = "mt-1 text-xs text-destructive";

interface FieldRowProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}

function FieldRow({ label, htmlFor, error, children }: FieldRowProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, refreshUser, isLoading } = useAuth();
  const {
    remaining,
    dailyLimit,
    usedToday,
    isLoading: usageLoading,
    error: usageError,
    refresh: usageRefresh,
  } = useChatUsage();

  const handleUsageRetry = () => {
    usageRefresh();
  };

  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [savedError, setSavedError] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<boolean>(false);

  // 공통
  const [name, setName] = useState("");

  // 학생 전용
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [grade, setGrade] = useState<number>(1);
  const [admissionYear, setAdmissionYear] = useState<number>(2020);
  const [academicStatus, setAcademicStatus] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // 교직원 전용
  const [staffDepartment, setStaffDepartment] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // 에러
  const [studentErrors, setStudentErrors] = useState<StudentSettingsErrors>({});
  const [staffErrors, setStaffErrors] = useState<StaffSettingsErrors>({});

  // user 로드 후 초기값 세팅
  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setStudentId(user.studentId ?? "");
    setDepartment(user.department ?? "");
    setGrade(user.grade ?? 1);
    setAdmissionYear(user.admissionYear ?? new Date().getFullYear());
    setAcademicStatus(user.academicStatus ?? "");
    setAdditionalInfo(user.additionalInfo ?? "");
    setStaffDepartment(user.staffDepartment ?? "");
    setJobDescription(user.jobDescription ?? "");
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isStudent = user?.userType === "student";
  const isStaff = user?.userType === "staff";

  const handleSave = async () => {
    setSavedMessage(null);
    setSavedError(false);

    // Zod 검증
    if (isStudent) {
      const result = studentSettingsSchema.safeParse({
        name,
        studentId: studentId || undefined,
        department,
        grade,
        admissionYear,
        academicStatus,
        additionalInfo,
      });
      if (!result.success) {
        setStudentErrors(
          extractErrors<StudentSettingsErrors>(result)
        );
        return;
      }
      setStudentErrors({});
    }

    if (isStaff) {
      const result = staffSettingsSchema.safeParse({
        name,
        staffDepartment,
        jobDescription,
      });
      if (!result.success) {
        setStaffErrors(extractErrors<StaffSettingsErrors>(result));
        return;
      }
      setStaffErrors({});
    }

    setIsSaving(true);
    try {
      if (isStudent) {
        await updateMyInfo({
          name: name.trim() || undefined,
          studentId: studentId.trim() || undefined,
          department: department || undefined,
          grade: grade || undefined,
          admissionYear: admissionYear || undefined,
          academicStatus: academicStatus || undefined,
          additionalInfo: additionalInfo.trim() || undefined,
        });
      } else if (isStaff) {
        await updateMyInfo({
          name: name.trim() || undefined,
          staffDepartment: staffDepartment || undefined,
          jobDescription: jobDescription.trim() || undefined,
        });
      } else {
        await updateMyInfo({ name: name.trim() || undefined });
      }
      await refreshUser();
      setSavedMessage("저장되었습니다.");
      setSavedError(false);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (ERROR_MESSAGES[err.code] ?? err.message)
          : "저장에 실패했습니다. 다시 시도해주세요.";
      setSavedMessage(msg);
      setSavedError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const clearMessage = () => {
    setSavedMessage(null);
    setSavedError(false);
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4">
        <h1 className="text-[18px] font-semibold text-foreground">설정</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
          {/* 채팅 사용량 섹션 */}
          <section className="rounded-lg border border-border bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-foreground">채팅 사용량</h3>

            {usageLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>사용량 정보를 불러오는 중...</span>
              </div>
            )}

            {usageError && !usageLoading && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-destructive">사용량 정보를 불러올 수 없습니다.</p>
                <button
                  onClick={handleUsageRetry}
                  className="w-fit rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90"
                >
                  재시도
                </button>
              </div>
            )}

            {!usageLoading && !usageError && dailyLimit != null && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">일일 한도</p>
                  <p className="text-lg font-medium text-foreground">{dailyLimit}회</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">오늘 사용</p>
                  <p className="text-lg font-medium text-foreground">{usedToday}회</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">남은 횟수</p>
                  <p className={cn("text-lg font-medium", remaining === 0 ? "text-destructive" : "text-foreground")}>
                    {remaining}회
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">초기화 시간</p>
                  <p className="text-lg font-medium text-foreground">매일 00:00 (KST)</p>
                </div>
              </div>
            )}
          </section>

          {/* 내 정보 섹션 */}
          <section className="rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">내 정보</h2>

            {/* 이메일 (읽기 전용) */}
            <FieldRow label="이메일">
              <p className="text-sm text-foreground">{user?.email ?? "-"}</p>
            </FieldRow>

            {/* 사용자 유형 (읽기 전용) */}
            <FieldRow label="사용자 유형">
              <p className="text-sm text-foreground">
                {isStudent ? "학생" : isStaff ? "교직원" : "-"}
              </p>
            </FieldRow>

            {/* 이름 */}
            <FieldRow
              label="이름"
              htmlFor="name"
              error={isStudent ? studentErrors.name : isStaff ? staffErrors.name : undefined}
            >
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(sanitizeName(e.target.value));
                  clearMessage();
                  if (isStudent) setStudentErrors((prev) => ({ ...prev, name: undefined }));
                  if (isStaff) setStaffErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={cn(
                  fieldClass,
                  (isStudent ? studentErrors.name : staffErrors.name) &&
                    "border-destructive focus:ring-destructive/30"
                )}
                placeholder="이름을 입력하세요"
              />
            </FieldRow>

            {/* 학생 전용 필드 */}
            {isStudent && (
              <>
                <FieldRow label="학번" htmlFor="studentId" error={studentErrors.studentId}>
                  <input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(e.target.value);
                      clearMessage();
                      setStudentErrors((prev) => ({ ...prev, studentId: undefined }));
                    }}
                    className={cn(
                      fieldClass,
                      studentErrors.studentId && "border-destructive focus:ring-destructive/30"
                    )}
                    placeholder="학번을 입력하세요 (8~10자리)"
                  />
                </FieldRow>

                <FieldRow label="학과/학부" htmlFor="department" error={studentErrors.department}>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      clearMessage();
                      setStudentErrors((prev) => ({ ...prev, department: undefined }));
                    }}
                    className={cn(
                      fieldClass,
                      studentErrors.department && "border-destructive focus:ring-destructive/30"
                    )}
                  >
                    <option value="">학과/학부 선택</option>
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="학년" htmlFor="grade" error={studentErrors.grade}>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => {
                      setGrade(Number(e.target.value));
                      clearMessage();
                      setStudentErrors((prev) => ({ ...prev, grade: undefined }));
                    }}
                    className={cn(
                      fieldClass,
                      studentErrors.grade && "border-destructive focus:ring-destructive/30"
                    )}
                  >
                    {GRADE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="입학년도" htmlFor="admissionYear" error={studentErrors.admissionYear}>
                  <input
                    id="admissionYear"
                    type="number"
                    value={admissionYear}
                    min={2000}
                    max={new Date().getFullYear()}
                    onChange={(e) => {
                      setAdmissionYear(Number(e.target.value));
                      clearMessage();
                      setStudentErrors((prev) => ({ ...prev, admissionYear: undefined }));
                    }}
                    className={cn(
                      fieldClass,
                      studentErrors.admissionYear &&
                        "border-destructive focus:ring-destructive/30"
                    )}
                    placeholder="입학년도 (예: 2020)"
                  />
                </FieldRow>

                <FieldRow label="재학 상태" htmlFor="academicStatus" error={studentErrors.academicStatus}>
                  <select
                    id="academicStatus"
                    value={academicStatus}
                    onChange={(e) => {
                      setAcademicStatus(e.target.value);
                      clearMessage();
                      setStudentErrors((prev) => ({ ...prev, academicStatus: undefined }));
                    }}
                    className={cn(
                      fieldClass,
                      studentErrors.academicStatus &&
                        "border-destructive focus:ring-destructive/30"
                    )}
                  >
                    <option value="">재학 상태 선택</option>
                    {ACADEMIC_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="추가 정보" htmlFor="additionalInfo">
                  <textarea
                    id="additionalInfo"
                    value={additionalInfo}
                    onChange={(e) => {
                      setAdditionalInfo(e.target.value);
                      clearMessage();
                    }}
                    rows={3}
                    className={cn(fieldClass, "resize-none")}
                    placeholder="추가 정보를 입력하세요 (선택)"
                  />
                </FieldRow>
              </>
            )}

            {/* 교직원 전용 필드 */}
            {isStaff && (
              <>
                <FieldRow label="소속 부서" htmlFor="staffDepartment" error={staffErrors.staffDepartment}>
                  <select
                    id="staffDepartment"
                    value={staffDepartment}
                    onChange={(e) => {
                      setStaffDepartment(e.target.value);
                      clearMessage();
                      setStaffErrors((prev) => ({ ...prev, staffDepartment: undefined }));
                    }}
                    className={cn(
                      fieldClass,
                      staffErrors.staffDepartment &&
                        "border-destructive focus:ring-destructive/30"
                    )}
                  >
                    <option value="">부서 선택</option>
                    {STAFF_DEPARTMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="업무 설명" htmlFor="jobDescription">
                  <textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      clearMessage();
                    }}
                    rows={3}
                    className={cn(fieldClass, "resize-none")}
                    placeholder="업무 내용을 입력하세요 (선택)"
                  />
                </FieldRow>
              </>
            )}

            {savedMessage && (
              <p
                className={`text-xs ${
                  savedError ? "text-destructive" : "text-primary"
                }`}
              >
                {savedMessage}
              </p>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </section>

          {/* 관리자 전용: 프로필 리셋 */}
          {user?.role === "admin" && (
            <section className="rounded-xl border border-destructive/30 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">개발/테스트 도구</h2>
              <p className="text-xs text-muted-foreground">
                본인의 프로필 데이터를 삭제하고 회원가입 플로우를 다시 테스트할 수 있습니다.
                admin 권한과 로그인 세션은 유지됩니다.
              </p>

              {resetMessage && (
                <p
                  className={`text-xs ${
                    resetError ? "text-destructive" : "text-primary"
                  }`}
                >
                  {resetMessage}
                </p>
              )}

              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm("정말 프로필을 초기화하시겠습니까?\n회원가입 플로우로 돌아갑니다.")) return;
                  setIsResetting(true);
                  setResetMessage(null);
                  setResetError(false);
                  try {
                    await resetMyProfile();
                    setResetMessage("프로필이 초기화되었습니다. 페이지를 새로고침합니다...");
                    setResetError(false);
                    await refreshUser();
                    // profileCompleted=false가 되면 미들웨어가 /login으로 리다이렉트
                    window.location.href = "/login";
                  } catch (err) {
                    const msg =
                      err instanceof ApiError
                        ? (ERROR_MESSAGES[err.code] ?? err.message)
                        : "프로필 초기화에 실패했습니다.";
                    setResetMessage(msg);
                    setResetError(true);
                  } finally {
                    setIsResetting(false);
                  }
                }}
                disabled={isResetting}
                className="w-full"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    초기화 중...
                  </>
                ) : (
                  "프로필 초기화 (회원가입 재테스트)"
                )}
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
