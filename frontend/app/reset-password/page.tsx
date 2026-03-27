export const dynamic = "force-dynamic";

type ResetPasswordSearchParams = Promise<{
  token?: string | string[];
}>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: ResetPasswordSearchParams;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const rawToken = resolved?.token;
  const token = Array.isArray(rawToken) ? (rawToken[0] ?? "") : (rawToken ?? "");
  return (
    <div style={{ padding: 24 }}>
      <h1>Reset Password</h1>
      <p>Token present: {token ? "YES" : "NO"}</p>
    </div>
  );
}
