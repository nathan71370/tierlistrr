"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";

export function SignInModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function close() {
    setStep("email");
    setCode("");
    setError(null);
    onClose();
  }

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });
      if (error) {
        setError(error.message ?? t("errorSend"));
        return;
      }
      setStep("code");
    });
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const { error } = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: code.trim(),
      });
      if (error) {
        setError(error.message ?? t("errorVerify"));
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={close} title={t("title")}>
      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <p className="text-sm leading-relaxed text-ink-soft">{t("emailIntro")}</p>
          <div>
            <Label htmlFor="signin-email">{t("emailLabel")}</Label>
            <Input
              id="signin-email"
              type="email"
              value={email}
              autoFocus
              required
              placeholder={t("emailPlaceholder")}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-terracotta">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={close}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending || !email.trim()}>
              {pending ? t("sending") : t("sendCode")}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            <MailCheck size={16} className="text-sage" />
            {t("codeSentTo", { email })}
          </p>
          <div>
            <Label htmlFor="signin-code">{t("codeLabel")}</Label>
            <Input
              id="signin-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              autoFocus
              required
              placeholder="123456"
              className="text-center text-lg tracking-[0.4em]"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          {error ? <p className="text-sm text-terracotta">{error}</p> : null}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className="kicker hover:text-ink"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
            >
              {t("changeEmail")}
            </button>
            <Button type="submit" disabled={pending || code.length < 6}>
              {pending ? t("verifying") : t("verify")}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
