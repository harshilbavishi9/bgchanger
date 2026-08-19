import { NextRequest, NextResponse } from "next/server";
import { getJobStatus } from "@/lib/jobs/manager";
import { getJobZipPath } from "@/lib/storage/paths";
import fs from "fs";
import fsPromises from "fs/promises";

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  const job = getJobStatus(jobId);

  if (!job || job.status !== "completed") {
    return NextResponse.json(
      { error: "Job is not completed or zip file is unavailable." },
      { status: 400 }
    );
  }

  const zipPath = getJobZipPath(jobId);

  try {
    const fileStat = await fsPromises.stat(zipPath);
    const fileStream = fs.createReadStream(zipPath);

    // Convert Node ReadStream to Web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    headers.set(
      "Content-Disposition",
      `attachment; filename="product-export-${jobId.slice(0, 8)}.zip"`
    );
    headers.set("Content-Length", fileStat.size.toString());

    return new NextResponse(readableStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[API Error] Failed to stream ZIP download:", error);
    return NextResponse.json(
      { error: "File download failed." },
      { status: 500 }
    );
  }
}
