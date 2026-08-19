import { NextResponse } from "next/server";
import { getAvailableColorBackgrounds } from "@/lib/storage/colors";

export async function GET() {
  try {
    const backgrounds = getAvailableColorBackgrounds(2000);
    return NextResponse.json({
      total: backgrounds.length,
      backgrounds,
    });
  } catch (error) {
    console.error("[API Error] Failed to retrieve color backgrounds:", error);
    return NextResponse.json(
      { error: "Unable to retrieve color background collection." },
      { status: 500 }
    );
  }
}
