import type { CategoryTreeResponse } from "@/types/api/document";

/**
 * 리프(leaf) 카테고리만 평탄화하여 반환한다.
 *
 * 백엔드는 상위(parent) 카테고리에 문서를 붙이는 것을 허용하지 않는다
 * (`DocumentService.getDocumentsByCategory` → `PARENT_CATEGORY_NOT_ALLOWED`).
 * 또한 문서 업로드/카테고리 수정 시에도 리프 카테고리 ID를 받는 것이 일반적이다.
 */
export interface FlatCategory {
  id: number;
  name: string;
  /** 최상위부터 리프까지의 전체 경로 (예: "학사규정 > 졸업") */
  fullPath: string;
}

export function flattenLeafCategories(
  nodes: CategoryTreeResponse[],
  parentPath: string[] = []
): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const node of nodes) {
    const path = [...parentPath, node.name];
    if (!node.children || node.children.length === 0) {
      result.push({
        id: node.categoryId,
        name: node.name,
        fullPath: path.join(" > "),
      });
    } else {
      result.push(...flattenLeafCategories(node.children, path));
    }
  }
  return result;
}
