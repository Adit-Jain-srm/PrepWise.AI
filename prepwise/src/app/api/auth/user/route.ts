import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/server";
import { getUser, getSubscription } from "@/lib/db/userRepository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await getUserFromRequest(request);
    
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = authResult;
    const user = await getUser(userId);
    const subscription = await getSubscription(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      subscription: subscription ? {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      } : {
        tier: "free" as const,
        status: "active" as const,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

