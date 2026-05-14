import type { Source } from "@/types/chat";

export interface TextSegment {
  type: "text";
  value: string;
}

export interface MarkerSegment {
  type: "marker";
  n: number;
  source: Source;
}

export type CitationSegment = TextSegment | MarkerSegment;

/**
 * 답변 본문의 {{N}} 패턴을 파싱하여 텍스트/마커 세그먼트 배열로 분해한다.
 * rawSources[N-1]이 존재하지 않는 마커는 텍스트로 무시(제거)한다.
 * streaming 중에는 불완전한 마커(예: "{{" 뒤에 닫는 "}}"가 아직 안 온 경우)를 텍스트로 유지한다.
 */
export function parseCitations(
  content: string,
  rawSources: Source[],
  streaming?: boolean
): CitationSegment[] {
  const segments: CitationSegment[] = [];
  // {{N}} 패턴 매칭 — N은 1 이상의 정수
  const pattern = /\{\{(\d+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    // 매치 이전 텍스트
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    const n = parseInt(match[1], 10);
    const source = rawSources[n - 1];

    if (source) {
      segments.push({ type: "marker", n, source });
    }
    // source가 없으면 마커를 무시 (범위 밖)

    lastIndex = match.index + match[0].length;
  }

  // 나머지 텍스트
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    // 스트리밍 중 불완전한 마커 처리: 끝에 "{{" 또는 "{{1" 같은 미완성 패턴이 있을 수 있음
    if (streaming) {
      // 불완전한 마커를 그대로 텍스트로 표시
      segments.push({ type: "text", value: remaining });
    } else {
      // 스트리밍 완료 후에는 남은 불완전 마커도 제거
      const cleaned = remaining.replace(/\{\{\d*$/, "");
      if (cleaned) {
        segments.push({ type: "text", value: cleaned });
      }
    }
  }

  return segments;
}
