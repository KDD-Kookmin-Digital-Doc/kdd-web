"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getFAQCandidates,
  getAdminFAQList,
  approveCandidate,
  rejectCandidate,
  deleteAdminFAQ,
} from "@/lib/api/services/admin.service";
import type { FAQItem } from "@/types/api/faq";
import type { FAQCandidate } from "@/types/api/admin";

type ActiveTab = "registered" | "candidates";

export function useAdminFAQ() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("registered");
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [candidates, setCandidates] = useState<FAQCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFAQs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAdminFAQList({ page: 0, pageSize: 100 });
      setFaqs(res.data);
    } catch {
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getFAQCandidates({ page: 0, pageSize: 100 });
      setCandidates(res.data);
    } catch {
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "registered") {
      loadFAQs();
    } else {
      loadCandidates();
    }
  }, [activeTab, loadFAQs, loadCandidates]);

  const deleteFAQ = useCallback(async (id: string) => {
    setFaqs((prev) => prev.filter((faq) => faq.faqId !== id));
    try {
      await deleteAdminFAQ(id);
    } catch {
      loadFAQs();
    }
  }, [loadFAQs]);

  const handleApproveCandidate = useCallback(
    async (id: string, topic: string) => {
      setCandidates((prev) =>
        prev.map((c) =>
          c.candidateId === id ? { ...c, status: "approved" as const } : c,
        ),
      );
      try {
        await approveCandidate(id, topic);
      } catch {
        loadCandidates();
      }
    },
    [loadCandidates],
  );

  const handleRejectCandidate = useCallback(
    async (id: string) => {
      setCandidates((prev) =>
        prev.map((c) =>
          c.candidateId === id ? { ...c, status: "rejected" as const } : c,
        ),
      );
      try {
        await rejectCandidate(id);
      } catch {
        loadCandidates();
      }
    },
    [loadCandidates],
  );

  return {
    activeTab,
    setActiveTab,
    faqs,
    candidates,
    deleteFAQ,
    approveCandidate: handleApproveCandidate,
    rejectCandidate: handleRejectCandidate,
    isLoading,
  };
}
