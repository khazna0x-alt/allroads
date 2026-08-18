"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import {
  AdminButton,
  AdminField,
  AdminSelect,
  DeskCard,
  EmptyState,
  GoldRule,
  PageHeader,
} from "@/components/admin/ui";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { api, type Id } from "@/lib/convex";
import { generateDeskPassword } from "@/lib/format";

type Credentials = { identifier: string; password: string };

export default function StaffPage() {
  const t = useTranslations("Admin");
  const me = useQuery(api.staff.me);
  const staff = useQuery(api.staff.list);
  const createStaff = useAction(api.staff.createStaff);
  const changePassword = useAction(api.staff.changePassword);
  const [created, setCreated] = useState<Credentials | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  if (me && me.role !== "admin") {
    return <p className="text-[var(--ivory-dim)]">{t("staffPage.adminRequired")}</p>;
  }

  return (
    <div>
      <PageHeader kicker={t("staffPage.kicker")} title={t("staffPage.title")} lead={t("staffPage.lead")} />
      <GoldRule />
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <DeskCard>
            <h2 className="font-display text-xl">{t("staffPage.createTitle")}</h2>
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const formData = new FormData(form);
                setCreating(true);
                void createStaff({
                  name: String(formData.get("name") ?? ""),
                  identifier: String(formData.get("identifier") ?? ""),
                  role: formData.get("role") === "editor" ? "editor" : "admin",
                  password: newPassword.trim() || undefined,
                })
                  .then((result) => {
                    setCreated(result);
                    setError("");
                    setNewPassword("");
                    form.reset();
                  })
                  .catch(() => {
                    setError(t("staffPage.failed"));
                  })
                  .finally(() => {
                    setCreating(false);
                  });
              }}
            >
              <AdminField name="name" label={t("staffPage.name")} required autoComplete="name" />
              <AdminField
                name="identifier"
                label={t("staffPage.identifier")}
                required
                autoComplete="off"
                spellCheck={false}
                placeholder={t("staffPage.identifierHint")}
              />
              <AdminSelect
                name="role"
                label={t("staffPage.role")}
                defaultValue="editor"
                options={["editor", "admin"]}
                formatLabel={(value) => t(`roles.${value}`)}
              />
              <div className="space-y-2">
                <AdminField
                  name="password"
                  label={t("staffPage.password")}
                  type="text"
                  value={newPassword}
                  onChange={setNewPassword}
                  minLength={8}
                  autoComplete="new-password"
                  spellCheck={false}
                  placeholder={t("staffPage.passwordHint")}
                />
                <AdminButton
                  type="button"
                  variant="ghost"
                  onClick={() => setNewPassword(generateDeskPassword())}
                >
                  {t("staffPage.generatePassword")}
                </AdminButton>
              </div>
              <AdminButton type="submit" variant="primary" disabled={creating}>
                {creating ? t("staffPage.creating") : t("staffPage.create")}
              </AdminButton>
            </form>
            {created ? <CredentialsNotice credentials={created} /> : null}
            {error ? (
              <p className="mt-3 text-sm text-[#f2c4c6]" role="alert">
                {error}
              </p>
            ) : null}
          </DeskCard>

          <DeskCard>
            <h2 className="font-display text-xl">{t("staffPage.changePassword")}</h2>
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const formData = new FormData(form);
                void changePassword({ newPassword: String(formData.get("ownPassword") ?? "") })
                  .then(() => form.reset())
                  .catch(() => setError(t("staffPage.failed")));
              }}
            >
              <AdminField
                name="ownPassword"
                label={t("staffPage.newPassword")}
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
              />
              <AdminButton type="submit">{t("staffPage.updatePassword")}</AdminButton>
            </form>
          </DeskCard>
        </div>

        <div>
          <h2 className="font-display text-xl">{t("staffPage.rosterTitle")}</h2>
          <div className="mt-5 space-y-4">
            {(staff ?? []).map((user) => (
              <RosterCard
                key={user._id}
                user={user}
                isSelf={user._id === me?._id}
                onCredentials={setCreated}
                onError={() => setError(t("staffPage.failed"))}
              />
            ))}
            {staff?.length === 0 ? <EmptyState title={t("staffPage.empty")} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function CredentialsNotice({ credentials }: { credentials: Credentials }) {
  const t = useTranslations("Admin.staffPage");
  const [copied, setCopied] = useState(false);
  const text = `${credentials.identifier}\n${credentials.password}`;

  return (
    <div className="mt-4 border border-[var(--sand)] bg-[var(--sand)]/8 p-4" aria-live="polite">
      <p className="text-xs tracking-[0.14em] text-[var(--sand)] uppercase">{t("shownOnce")}</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-[var(--ivory-dim)]">{t("loginLabel")}</dt>
          <dd className="mt-1 break-all font-medium" dir="ltr">
            {credentials.identifier}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--ivory-dim)]">{t("passwordLabel")}</dt>
          <dd className="mt-1 break-all font-medium" dir="ltr">
            {credentials.password}
          </dd>
        </div>
      </dl>
      <AdminButton
        className="mt-4"
        variant="ghost"
        onClick={() => {
          void navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? t("copied") : t("copy")}
      </AdminButton>
    </div>
  );
}

function RosterCard({
  user,
  isSelf,
  onCredentials,
  onError,
}: {
  user: {
    _id: Id<"users">;
    name?: string;
    identifier: string;
    role: "admin" | "editor";
  };
  isSelf: boolean;
  onCredentials: (value: Credentials) => void;
  onError: () => void;
}) {
  const t = useTranslations("Admin");
  const confirm = useConfirmDialog();
  const updateStaff = useMutation(api.staff.updateStaff);
  const removeStaff = useMutation(api.staff.removeStaff);
  const setStaffPassword = useAction(api.staff.setStaffPassword);
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await updateStaff({
        userId: user._id,
        name: String(formData.get("name") ?? ""),
        identifier: String(formData.get("identifier") ?? ""),
        role: formData.get("role") === "editor" ? "editor" : "admin",
      });
      setEditing(false);
    } catch {
      onError();
    } finally {
      setBusy(false);
    }
  }

  async function savePassword() {
    setBusy(true);
    try {
      const result = await setStaffPassword({
        userId: user._id,
        password: password.trim() || undefined,
      });
      onCredentials(result);
      setPassword("");
    } catch {
      onError();
    } finally {
      setBusy(false);
    }
  }

  async function removeUser() {
    const result = await confirm({
      title: t("confirm.removeStaffTitle"),
      message: t("confirm.removeStaff"),
      confirmLabel: t("staffPage.remove"),
      cancelLabel: t("confirm.cancel"),
      tone: "danger",
    });
    if (!result.confirmed) {
      return;
    }
    setBusy(true);
    try {
      await removeStaff({ userId: user._id });
    } catch {
      onError();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="admin-card p-4">
      {editing ? (
        <form className="space-y-4" onSubmit={(event) => void saveDetails(event)}>
          <AdminField name="name" label={t("staffPage.name")} defaultValue={user.name} required />
          <AdminField
            name="identifier"
            label={t("staffPage.identifier")}
            defaultValue={user.identifier}
            required
            spellCheck={false}
          />
          <AdminSelect
            name="role"
            label={t("staffPage.role")}
            defaultValue={user.role}
            options={["editor", "admin"]}
            formatLabel={(value) => t(`roles.${value}`)}
          />
          <div className="flex flex-wrap gap-2">
            <AdminButton type="submit" variant="primary" disabled={busy}>
              {t("staffPage.saveDetails")}
            </AdminButton>
            <AdminButton type="button" variant="ghost" onClick={() => setEditing(false)}>
              {t("confirm.cancel")}
            </AdminButton>
          </div>
        </form>
      ) : (
        <>
          <p className="font-display text-xl">{user.name}</p>
          <p className="mt-1 text-sm" dir="ltr">
            {user.identifier}
          </p>
          <p className="mt-2 text-xs tracking-[0.14em] text-[var(--sand)] uppercase">
            {t(`roles.${user.role}`)}
          </p>
        </>
      )}

      <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
        <p className="text-xs tracking-[0.14em] text-[var(--sand)] uppercase">{t("staffPage.setPassword")}</p>
        <AdminField
          name={`password-${user._id}`}
          label={t("staffPage.password")}
          type="text"
          value={password}
          onChange={setPassword}
          minLength={8}
          autoComplete="new-password"
          spellCheck={false}
          placeholder={t("staffPage.passwordHint")}
        />
        <div className="flex flex-wrap gap-2">
          <AdminButton type="button" variant="ghost" onClick={() => setPassword(generateDeskPassword())}>
            {t("staffPage.generatePassword")}
          </AdminButton>
          <AdminButton type="button" disabled={busy} onClick={() => void savePassword()}>
            {t("staffPage.setPassword")}
          </AdminButton>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!editing ? (
          <AdminButton onClick={() => setEditing(true)} disabled={busy}>
            {t("staffPage.edit")}
          </AdminButton>
        ) : null}
        {!isSelf ? (
          <AdminButton variant="danger" disabled={busy} onClick={() => void removeUser()}>
            {t("staffPage.remove")}
          </AdminButton>
        ) : null}
      </div>
    </article>
  );
}
