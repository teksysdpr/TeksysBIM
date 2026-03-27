import { NextRequest, NextResponse } from "next/server";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

function normalizeMobile(value: string) {
  return value.replace(/\D/g, "");
}

function isValidMobile(value: string) {
  const digits = normalizeMobile(value);
  return digits.length >= 10 && digits.length <= 15;
}

function extractErrorMessage(data: any, fallback = "Failed to submit enquiry.") {
  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    const first = data.detail[0];
    if (typeof first === "string") return first;
    if (first?.msg) return first.msg;
    return data.detail.map((item: any) => item?.msg || JSON.stringify(item)).join("; ");
  }

  if (typeof data?.detail === "object" && data.detail !== null) {
    if (data.detail.msg) return data.detail.msg;
    try {
      return JSON.stringify(data.detail);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body?.name || "").trim();
    const company = String(body?.company || "").trim();
    const email = String(body?.email || "").trim();
    const message = String(body?.message || "").trim();
    const mobileRaw = String(body?.mobile || body?.phone || "").trim();
    const mobile = normalizeMobile(mobileRaw);

    if (!name) {
      return NextResponse.json({ message: "Please enter your full name." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ message: "Please enter your email address." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    if (mobileRaw && !isValidMobile(mobileRaw)) {
      return NextResponse.json(
        { message: "Please enter a valid mobile number with 10 to 15 digits." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json({ message: "Please enter your requirement." }, { status: 400 });
    }

    const backendBase =
      process.env.CONTACT_FORM_API_URL ||
      (process.env.NEXT_PUBLIC_BACKEND_URL
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, "")}/public/contact`
        : "");

    if (!backendBase) {
      return NextResponse.json(
        { message: "Contact API is not configured on the server." },
        { status: 500 }
      );
    }

    const upstreamRes = await fetch(backendBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        company,
        email,
        mobile,
        phone: mobile,
        portal: "BIM Portal",
        message,
      }),
    });

    const rawText = await upstreamRes.text();
    let data: any = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = rawText;
    }

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data) },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json(
      {
        message:
          typeof data?.message === "string" && data.message.trim()
            ? data.message
            : "Thank you. Your enquiry has been submitted successfully.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to submit enquiry.",
      },
      { status: 500 }
    );
  }
}
