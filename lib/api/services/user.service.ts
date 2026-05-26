import { apiClient } from '@/lib/api/client';
import type { ApiRequestOptions } from '@/lib/api/client';
import { delay } from '@/lib/api/mock';
import type { UserResponse, CreateProfileRequest, UpdateUserRequest } from '@/types/api/user';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const MOCK_USER: UserResponse = {
  userId: 1,
  email: 'honggildong@kookmin.ac.kr',
  name: '홍길동',
  role: 'user',
  profileCompleted: true,
  userType: 'student',
  studentId: '20201234',
  department: 'software',
  grade: 3,
  admissionYear: 2020,
  academicStatus: 'enrolled',
  additionalInfo: null,
  staffDepartment: null,
  jobDescription: null,
};

export async function getMyInfo(options?: ApiRequestOptions): Promise<UserResponse> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_USER;
  }
  return apiClient.get<UserResponse>('/users/me', options);
}

export async function createProfile(data: CreateProfileRequest): Promise<UserResponse> {
  if (USE_MOCK) {
    await delay(500);
    return {
      ...MOCK_USER,
      name: data.name,
      userType: data.userType,
      profileCompleted: true,
    };
  }
  return apiClient.post<UserResponse>('/users/me/profile', data);
}

export async function updateMyInfo(data: UpdateUserRequest): Promise<UserResponse> {
  if (USE_MOCK) {
    await delay(400);
    return { ...MOCK_USER, ...data };
  }
  return apiClient.patch<UserResponse>('/users/me', data);
}
