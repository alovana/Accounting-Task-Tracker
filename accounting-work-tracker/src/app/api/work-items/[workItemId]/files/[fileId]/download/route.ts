import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getWorkItemFileDownloadUrl } from "@/lib/r2";
import { getCustomers, getWorkCycles, getWorkItemFiles, getWorkItems } from "@/lib/supabase/queries";
import { getVisibleWorkScope } from "@/lib/work-items/visibility";

export async function GET(
  _request: Request,
  context: { params: Promise<{ workItemId: string; fileId: string }> },
) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workItemId, fileId } = await context.params;
  const [customers, workCycles, workItems, files] = await Promise.all([
    getCustomers(),
    getWorkCycles(),
    getWorkItems(),
    getWorkItemFiles(),
  ]);
  const scope = getVisibleWorkScope({
    currentUser,
    customers,
    workCycles,
    workItems,
  });

  if (!scope.visibleWorkItems.some((item) => item.id === workItemId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const file = files.find((item) => item.id === fileId && item.workItemId === workItemId);

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const downloadUrl = await getWorkItemFileDownloadUrl({
    objectKey: file.storageObjectKey,
    fileName: file.fileName,
  });

  return NextResponse.redirect(downloadUrl);
}
