import Image from "next/image";
import { UserRole, UserStatus } from "@prisma/client";
import { authenticator } from "otplib";
import { getDatabaseStatus } from "@/lib/db";
import { requireStatus, getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { describeUserAgent, describeLocation, formatDateTime } from "@/lib/utils";
import { lookupGeo } from "@/lib/geo";
import {
  updateProfile,
  changePassword,
  toggleLoginAlerts,
  generateTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  revokeSession,
  revokeAllSessions,
  regenerateRecoveryCodes,
  generateVerificationLink,
} from "./actions";

type SettingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TIME_ZONES = [
  { value: "Pacific/Midway", label: "Midway (UTC-11:00)" },
  { value: "Pacific/Honolulu", label: "Honolulu (UTC-10:00)" },
  { value: "America/Anchorage", label: "Anchorage (UTC-09:00)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-08:00)" },
  { value: "America/Denver", label: "Denver (UTC-07:00)" },
  { value: "America/Chicago", label: "Chicago (UTC-06:00)" },
  { value: "America/New_York", label: "New York (UTC-05:00)" },
  { value: "America/Caracas", label: "Caracas (UTC-04:00)" },
  { value: "America/Sao_Paulo", label: "São Paulo (UTC-03:00)" },
  { value: "Atlantic/Azores", label: "Azores (UTC-01:00)" },
  { value: "UTC", label: "UTC (GMT+00:00)" },
  { value: "Europe/London", label: "London (UTC+00:00)" },
  { value: "Europe/Paris", label: "Paris (UTC+01:00)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+01:00)" },
  { value: "Europe/Athens", label: "Athens (UTC+02:00)" },
  { value: "Africa/Cairo", label: "Cairo (UTC+02:00)" },
  { value: "Asia/Dubai", label: "Dubai (UTC+04:00)" },
  { value: "Asia/Karachi", label: "Karachi (UTC+05:00)" },
  { value: "Asia/Kolkata", label: "India (UTC+05:30)" },
  { value: "Asia/Bangkok", label: "Bangkok (UTC+07:00)" },
  { value: "Asia/Shanghai", label: "Shanghai (UTC+08:00)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+09:00)" },
  { value: "Asia/Seoul", label: "Seoul (UTC+09:00)" },
  { value: "Australia/Sydney", label: "Sydney (UTC+10:00)" },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12:00)" },
];

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const user = await requireStatus(UserStatus.ACTIVE);
  const dbStatus = await getDatabaseStatus();
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      bannerUrl: true,
      handle: true,
      pronouns: true,
      bio: true,
      locale: true,
      timeZone: true,
      theme: true,
      loginAlerts: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      emailVerified: true,
      notificationEmailOptIn: true,
      notificationPushOptIn: true,
      notificationInAppOptIn: true,
    },
  });
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const sessionGeo = await Promise.all(
    sessions.map(async (s) => ({
      id: s.id,
      geo: await lookupGeo(s.ipAddress),
    }))
  );
  const recoveryCodes = await prisma.recoveryCode.findMany({
    where: { userId: user.id, used: false },
    orderBy: { createdAt: "desc" },
  });
  const securityEvents = await prisma.securityEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const latestVerifyToken = await prisma.emailVerificationToken.findFirst({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  const otpauthUrl =
    fullUser?.twoFactorSecret && fullUser.email
      ? authenticator.keyuri(fullUser.email, "EcoTek", fullUser.twoFactorSecret)
      : null;

  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;
  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Settings</h1>
        <p className="text-[var(--color-text-muted)]">Manage your account, security, and preferences.</p>
      </div>

      {(success || error) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            success
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {success ?? error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text-heading)]">Profile</h2>
          <form action={updateProfile} className="mt-4 space-y-4">
            <input type="hidden" name="currentAvatarUrl" value={fullUser?.avatarUrl ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField name="displayName" label="Display name" defaultValue={fullUser?.displayName ?? ""} />
              <InputField name="handle" label="Handle / username" defaultValue={fullUser?.handle ?? ""} />
              <InputField name="bannerUrl" label="Banner URL" defaultValue={fullUser?.bannerUrl ?? ""} />
              <InputField name="locale" label="Language/locale" defaultValue={fullUser?.locale ?? "en-US"} />
              <SelectField
                name="timeZone"
                label="Time zone"
                defaultValue={fullUser?.timeZone ?? "UTC"}
                options={TIME_ZONES}
              />
              <SelectField
                name="theme"
                label="Theme"
                defaultValue={fullUser?.theme ?? "system"}
                options={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
              <div className="space-y-3 text-sm text-[var(--color-text-heading)] sm:col-span-2">
                <span className="font-medium">Profile picture</span>
                <div className="flex flex-wrap items-start gap-4">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 focus-within:ring-2 focus-within:ring-brand-primary/30">
                    <input
                      type="file"
                      name="avatarFile"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const img = document.getElementById("avatar-preview") as HTMLImageElement | null;
                          const label = document.getElementById("avatar-placeholder");
                          if (img && typeof reader.result === "string") {
                            img.src = reader.result;
                            img.classList.remove("hidden");
                          }
                          label?.classList.add("hidden");
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <span>Select image</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-xs text-neutral-500">
                      {fullUser?.avatarUrl ? (
                        <Image
                          src={fullUser.avatarUrl}
                          alt="Current avatar"
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                          id="avatar-preview"
                        />
                      ) : (
                        <>
                          <Image
                            src="/placeholder-avatar.png"
                            alt="New avatar preview"
                            id="avatar-preview"
                            width={96}
                            height={96}
                            className="hidden h-full w-full object-cover"
                          />
                          <span id="avatar-placeholder">No photo</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">Upload a square JPG or PNG under 2 MB.</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-heading)]">Bio</label>
              <textarea
                name="bio"
                defaultValue={fullUser?.bio ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-heading)]">
              <input type="checkbox" name="notificationEmailOptIn" defaultChecked={!!fullUser?.notificationEmailOptIn} />
              <span>Email notifications enabled</span>
            </label>
            <button className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white">
              Save profile
            </button>
          </form>
          <div className="mt-4 rounded-xl border border-border bg-[var(--color-bg-alt)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text-heading)]">Email verification</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {fullUser?.emailVerified ? "Verified" : "Not verified"}
                </div>
                {!fullUser?.emailVerified && latestVerifyToken && (
                  <div className="mt-2 text-xs text-[var(--color-text-muted)] break-all">
                    Latest link: <code>/verify-email?token={latestVerifyToken.token}</code>
                  </div>
                )}
              </div>
              {!fullUser?.emailVerified && (
                <form action={generateVerificationLink}>
                  <button className="rounded-lg bg-[var(--color-accent-primary)] px-3 py-2 text-xs font-semibold text-white">
                    Generate link
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-xl font-semibold text-[var(--color-text-heading)]">Notifications</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Control which alerts you receive. Email toggles are stored; push and in-app are coming soon.
          </p>
          <form action={toggleLoginAlerts} className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-heading)]">
              <input
                id="notify-email"
                name="loginAlerts"
                type="checkbox"
                defaultChecked={!!fullUser?.loginAlerts}
                className="h-4 w-4"
              />
              <span>Email alerts for new logins</span>
            </label>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <input type="checkbox" disabled className="h-4 w-4" />
              <span>Push notifications (coming soon)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <input type="checkbox" disabled className="h-4 w-4" />
              <span>In-app alerts (coming soon)</span>
            </div>
            <button className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white">
              Save notification prefs
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-heading)]">Security</h2>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Change password</h3>
            <form action={changePassword} className="space-y-3">
              <InputField name="currentPassword" label="Current password" type="password" />
              <InputField name="newPassword" label="New password" type="password" />
              <button className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white">
                Update password
              </button>
            </form>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">Two-Factor Authentication</h3>
            {fullUser?.twoFactorEnabled ? (
              <form action={disableTwoFactor} className="space-y-2">
                <p className="text-sm text-[var(--color-text-muted)]">2FA is enabled. You can disable it below.</p>
                <button className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-800">
                  Disable 2FA
                </button>
              </form>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Enable 2FA to add a TOTP code requirement at login. Generate a secret, scan it in your authenticator app, then verify.
                </p>
                {!fullUser?.twoFactorSecret && (
                  <form action={generateTwoFactor}>
                    <button className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white">
                      Generate 2FA secret
                    </button>
                  </form>
                )}
                {fullUser?.twoFactorSecret && (
                  <div className="space-y-2 rounded-lg border border-border bg-[var(--color-bg-alt)] p-3 text-sm">
                    <div>
                      <span className="font-semibold">Secret:</span>{" "}
                      <code className="break-all">{fullUser.twoFactorSecret}</code>
                    </div>
                    {otpauthUrl && (
                      <div className="flex flex-col gap-2 rounded-lg border border-border bg-white p-2">
                        <div className="text-xs font-semibold text-[var(--color-text-heading)]">Scan QR</div>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                            otpauthUrl
                          )}`}
                          alt="2FA QR code"
                          className="h-44 w-44 self-start rounded-md border border-border bg-white"
                        />
                        <div className="text-xs text-[var(--color-text-muted)] break-all">
                          otpauth: <code>{otpauthUrl}</code>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Add this secret or its QR code to your authenticator app, then enter the 6-digit code to verify.
                    </div>
                    <form action={verifyTwoFactor} className="flex items-center gap-2">
                      <input
                        name="code"
                        placeholder="123456"
                        required
                        className="w-32 rounded border border-border px-2 py-1 text-sm"
                      />
                      <button className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white">
                        Verify & enable
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">Login alerts</h3>
            <form action={toggleLoginAlerts} className="flex items-center gap-2">
              <input
                id="loginAlerts"
                name="loginAlerts"
                type="checkbox"
                defaultChecked={!!fullUser?.loginAlerts}
                className="h-4 w-4"
              />
              <label htmlFor="loginAlerts" className="text-sm text-[var(--color-text-heading)]">
                Email me when a new login occurs
              </label>
              <button className="ml-auto rounded-lg bg-[var(--color-accent-primary)] px-3 py-2 text-xs font-semibold text-white">
                Save
              </button>
            </form>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">Recovery codes</h3>
            {recoveryCodes.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No active recovery codes. Generate a new set.</p>
            ) : (
              <div className="rounded-lg border border-border bg-[var(--color-bg-alt)] p-3 text-sm">
                <p className="text-xs text-[var(--color-text-muted)]">Use a code when you cannot access your 2FA device.</p>
                <ul className="mt-2 grid grid-cols-2 gap-2 text-sm font-mono">
                  {recoveryCodes.map((c) => (
                    <li key={c.id} className="rounded bg-white px-2 py-1 text-center shadow-sm">
                      {c.code}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form action={regenerateRecoveryCodes}>
              <button className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white">
                Regenerate codes
              </button>
            </form>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--color-text-heading)]">Active sessions</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Revoke sessions to sign out devices.</p>
        <div className="mt-3 divide-y rounded-lg border">
          {sessions.length === 0 && <p className="p-4 text-sm text-[var(--color-text-muted)]">No sessions found.</p>}
          {sessions.map((s) => {
            const isCurrent = s.jti === user.sessionId;
            const deviceLabel = describeUserAgent(s.userAgent);
            const geo = sessionGeo.find((g) => g.id === s.id)?.geo;
            return (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="space-y-1">
                  <div className="font-medium text-[var(--color-text-heading)]">
                    {isCurrent ? "Current session" : "Session"}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    Created {new Date(s.createdAt).toLocaleString()} · Last seen {new Date(s.lastSeenAt).toLocaleString()}
                  </div>
                  {s.userAgent && <div className="text-xs text-[var(--color-text-muted)]">{deviceLabel}</div>}
                  {s.ipAddress && (
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {describeLocation(s.ipAddress)}
                      {geo?.country && ` · ${geo.city ? `${geo.city}, ` : ""}${geo.country}`}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {s.revoked && <span className="text-xs text-red-600">Revoked</span>}
                  {!s.revoked && (
                    <form action={revokeSession}>
                      <input type="hidden" name="sessionId" value={s.jti} />
                      <button
                        className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 disabled:opacity-50"
                        disabled={isCurrent}
                      >
                        Revoke
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {sessions.length > 0 && (
          <form action={revokeAllSessions} className="mt-3">
            <button className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-800">
              Sign out of all sessions
            </button>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--color-text-heading)]">Security log</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Recent security-related actions.</p>
        <div className="mt-3 divide-y rounded-lg border">
          {securityEvents.length === 0 && <p className="p-4 text-sm text-[var(--color-text-muted)]">No events yet.</p>}
          {securityEvents.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="space-y-1">
                  <div className="font-medium text-[var(--color-text-heading)]">{e.eventType}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                  {formatDateTime(e.createdAt, user.locale ?? "en-US", user.timeZone ?? "UTC")} {e.detail ? `· ${e.detail}` : ""}
                  </div>
                </div>
              <div className="text-xs text-[var(--color-text-muted)] text-right space-y-1">
                {e.ipAddress && <div>IP: {e.ipAddress}</div>}
                {e.userAgent && <div className="max-w-[200px] truncate">UA: {e.userAgent}</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text-heading)]">Database</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            PostgreSQL connection string is read from <code>DATABASE_URL</code>.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-heading)]">Status</p>
              <p className="text-sm text-[var(--color-text-muted)]">{dbStatus.message}</p>
            </div>
            <span
              className={`rounded-full px-4 py-1 text-xs font-semibold ${
                dbStatus.connected
                  ? "bg-[var(--color-status-pass-bg)] text-[var(--color-status-pass-text)]"
                  : "bg-[var(--color-status-fail-bg)] text-[var(--color-status-fail-text)]"
              }`}
            >
              {dbStatus.connected ? "Connected" : "Offline"}
            </span>
          </div>
        </section>
      )}
    </div>
  );
}

function InputField({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="space-y-1 text-sm text-[var(--color-text-heading)]">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="space-y-1 text-sm text-[var(--color-text-heading)]">
      <span className="font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
