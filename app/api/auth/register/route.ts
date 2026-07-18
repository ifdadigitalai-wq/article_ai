import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Public registration is disabled. Student accounts are provisioned by administrators. Faculty and admin credentials are seeded." },
    { status: 403 }
  );
}

