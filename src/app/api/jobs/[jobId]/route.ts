import { NextRequest, NextResponse } from "next/server";
import { getJobStatus } from "@/lib/jobs/manager";

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  const job = getJobStatus(jobId);

  if (!job) {
    return NextResponse.json(
      { error: "Job not found or expired." },
      { status: 404 }
    );
  }

  return NextResponse.json(job);
}
