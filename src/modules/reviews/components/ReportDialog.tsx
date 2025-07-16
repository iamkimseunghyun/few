"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";

interface ReportDialogProps {
  reviewId: string;
  onClose: () => void;
}

export function ReportDialog({ reviewId, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState<"spam" | "inappropriate" | "misleading" | "other">("spam");
  const [description, setDescription] = useState("");

  const reportMutation = api.reviews.report.useMutation({
    onSuccess: () => {
      alert("신고가 접수되었습니다.");
      onClose();
    },
    onError: (error) => {
      alert(error.message || "신고 중 오류가 발생했습니다.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportMutation.mutate({
      reviewId,
      reason,
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">리뷰 신고</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">신고 사유</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as typeof reason)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="spam">스팸</option>
              <option value="inappropriate">부적절한 내용</option>
              <option value="misleading">오해의 소지가 있음</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              상세 설명 (선택사항)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              rows={3}
              placeholder="신고 사유를 자세히 설명해주세요"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={reportMutation.isPending}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {reportMutation.isPending ? "신고 중..." : "신고하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}