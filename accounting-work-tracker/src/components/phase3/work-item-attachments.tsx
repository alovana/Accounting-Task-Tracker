"use client";

import { useActionState } from "react";
import { deleteWorkItemFileAction, uploadWorkItemFileAction } from "@/app/work-cycles/actions";
import { formatBytesAsMb, workItemFileValidation } from "@/lib/work-item-file-validation";
import type { WorkItemFile } from "@/types/attachments";

const initialState = {
  success: false,
  message: "",
  error: "",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type WorkItemAttachmentsProps = {
  workItemId: string;
  files: WorkItemFile[];
  canDelete: boolean;
};

export function WorkItemAttachments({ workItemId, files, canDelete }: WorkItemAttachmentsProps) {
  const [uploadState, uploadAction, isUploadPending] = useActionState(uploadWorkItemFileAction, initialState);
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteWorkItemFileAction, initialState);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">ไฟล์แนบ</p>
          <p className="text-xs text-slate-500">อัปโหลดเอกสารประกอบงาน และเปิดดาวน์โหลดได้ตามสิทธิ์การมองเห็นเดิม</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{files.length} ไฟล์</span>
      </div>

      <form action={uploadAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input type="hidden" name="workItemId" value={workItemId} />
        <input
          type="file"
          name="attachment"
          accept={workItemFileValidation.allowedAcceptValues.join(",")}
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isUploadPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300"
        >
          {isUploadPending ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์"}
        </button>
      </form>

      <p className="mt-3 text-xs text-slate-500">
        รองรับไฟล์ {workItemFileValidation.allowedLabels.join(", ")} และขนาดไม่เกิน {formatBytesAsMb(workItemFileValidation.maxUploadSizeBytes)} ต่อไฟล์
      </p>

      {uploadState.error ? <p className="mt-3 text-sm text-rose-700">{uploadState.error}</p> : null}
      {uploadState.message ? <p className="mt-3 text-sm text-emerald-700">{uploadState.message}</p> : null}
      {deleteState.error ? <p className="mt-3 text-sm text-rose-700">{deleteState.error}</p> : null}
      {deleteState.message ? <p className="mt-3 text-sm text-emerald-700">{deleteState.message}</p> : null}

      <div className="mt-4 space-y-3">
        {files.length === 0 ? (
          <p className="rounded-lg bg-white px-3 py-4 text-sm text-slate-500">ยังไม่มีไฟล์แนบสำหรับงานนี้</p>
        ) : (
          files.map((file) => (
            <div key={file.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{file.fileName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatFileSize(file.fileSizeBytes)} · {file.uploadedByName} · {new Date(file.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/work-items/${workItemId}/files/${file.id}/download`}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    ดาวน์โหลด
                  </a>
                  {canDelete ? (
                    <form action={deleteAction}>
                      <input type="hidden" name="workItemId" value={workItemId} />
                      <input type="hidden" name="fileId" value={file.id} />
                      <button
                        type="submit"
                        disabled={isDeletePending}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        ลบ
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
