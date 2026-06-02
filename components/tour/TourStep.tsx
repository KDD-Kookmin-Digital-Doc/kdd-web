"use client";

import type { ReactNode } from "react";

/**
 * 투어 단계 wrapper — 각 단계의 타깃 엘리먼트를 감싸는 컴포넌트.
 *
 * 현재는 children을 그대로 렌더링하는 패스스루지만, 추후 `stepId`로 식별되는
 * ref를 TourProvider에 등록해 spotlight(하이라이트) 위치 계산에 활용할 예정이다.
 *
 * @param props.children 감쌀 타깃 엘리먼트
 * @param props.stepId   투어 단계 식별자 (spotlight 위치 계산용, 현재 미사용)
 */
export default function TourStep({
  children,
}: {
  children: ReactNode;
  /** 투어 단계 식별자 — TourProvider ref 등록에 사용 예정 (현재 미사용) */
  stepId: string;
}) {
  return <>{children}</>;
}
