import { getSupabaseServerClient } from "@/lib/supabase/server";

const LINE_PUSH_API_URL = "https://api.line.me/v2/bot/message/push";
const DEFAULT_BATCH_SIZE = 20;

type DispatchResult = {
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  configError?: string;
};

type QueuedNotification = {
  id: string;
  message: string;
};

type LineConfig =
  | { error: string }
  | {
      channelAccessToken: string;
      targetGroupId: string;
      senderName?: string;
      senderIconUrl?: string;
    };

function getLineConfig(): LineConfig {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  const targetGroupId = process.env.LINE_TARGET_GROUP_ID?.trim();
  const senderName = process.env.LINE_SENDER_NAME?.trim();
  const senderIconUrl = process.env.LINE_SENDER_ICON_URL?.trim();

  if (!channelAccessToken) {
    return { error: "Missing LINE_CHANNEL_ACCESS_TOKEN" };
  }

  if (!targetGroupId) {
    return { error: "Missing LINE_TARGET_GROUP_ID" };
  }

  return {
    channelAccessToken,
    targetGroupId,
    senderName,
    senderIconUrl,
  };
}

function buildTextMessage(message: string, senderName?: string, senderIconUrl?: string) {
  const sender = senderName && senderIconUrl ? { name: senderName, iconUrl: senderIconUrl } : undefined;

  return {
    type: "text",
    text: message,
    ...(sender ? { sender } : {}),
  };
}

async function sendLinePushMessage(message: string, channelAccessToken: string, targetGroupId: string, senderName?: string, senderIconUrl?: string) {
  const response = await fetch(LINE_PUSH_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: targetGroupId,
      messages: [buildTextMessage(message, senderName, senderIconUrl)],
    }),
    cache: "no-store",
  });

  if (response.ok) {
    return;
  }

  const rawBody = await response.text();
  throw new Error(`LINE API ${response.status}: ${rawBody || response.statusText}`);
}

async function markBatchFailed(ids: string[], errorMessage: string) {
  if (ids.length === 0) {
    return;
  }

  const supabase = getSupabaseServerClient();
  await supabase
    .from("line_notifications")
    .update({
      status: "failed",
      error_message: errorMessage.slice(0, 1000),
    })
    .in("id", ids)
    .eq("status", "queued");
}

async function claimQueuedNotification(notification: QueuedNotification) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("line_notifications")
    .update({
      status: "processing",
      error_message: null,
    })
    .eq("id", notification.id)
    .eq("status", "queued")
    .select("id, message")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to claim notification");
  }

  return data as QueuedNotification | null;
}

export async function dispatchQueuedLineNotifications(batchSize = DEFAULT_BATCH_SIZE): Promise<DispatchResult> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("line_notifications")
    .select("id, message")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(error.message || "Unable to load queued LINE notifications");
  }

  const queue = (data ?? []) as QueuedNotification[];

  if (queue.length === 0) {
    return { attempted: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const config = getLineConfig();
  if ("error" in config) {
    const configError = config.error;

    await markBatchFailed(
      queue.map((item) => item.id),
      configError,
    );

    return {
      attempted: queue.length,
      sent: 0,
      failed: queue.length,
      skipped: 0,
      configError,
    };
  }

  const result: DispatchResult = {
    attempted: queue.length,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const item of queue) {
    const claimed = await claimQueuedNotification(item);

    if (!claimed) {
      result.skipped += 1;
      continue;
    }

    try {
      await sendLinePushMessage(
        claimed.message,
        config.channelAccessToken,
        config.targetGroupId,
        config.senderName,
        config.senderIconUrl,
      );

      const { error: updateError } = await supabase
        .from("line_notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", claimed.id)
        .eq("status", "processing");

      if (updateError) {
        throw new Error(updateError.message || "Unable to mark notification as sent");
      }

      result.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown LINE dispatch error";
      await supabase
        .from("line_notifications")
        .update({
          status: "failed",
          error_message: message.slice(0, 1000),
        })
        .eq("id", claimed.id)
        .eq("status", "processing");

      result.failed += 1;
    }
  }

  return result;
}
