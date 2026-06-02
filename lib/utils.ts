import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind 클래스를 조건부로 합성하고 충돌을 해소한다.
 *
 * `clsx`로 조건부/배열/객체 형태의 클래스를 하나의 문자열로 합친 뒤,
 * `tailwind-merge`로 상충하는 유틸리티(예: `px-2`와 `px-4`)를 뒤에 온 값으로 정리한다.
 *
 * @param inputs - 문자열·배열·객체 등 clsx가 지원하는 클래스 값들
 * @returns 중복/충돌이 정리된 className 문자열
 *
 * @example
 * cn("px-2 py-1", isActive && "bg-primary", "px-4")
 * // → "py-1 bg-primary px-4"  (px-2는 px-4로 대체)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
