import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "File uploads and attachment downloads have been removed from this system." },
    { status: 410 },
  );
}
