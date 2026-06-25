"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
        setError(error.message ?? "Échec de l'envoi du code.");
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
        setError(error.message ?? "Code invalide ou expiré.");
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={close} title="Connexion">
      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <p className="text-sm leading-relaxed text-ink-soft">
            Entre ton email : on t&apos;envoie un code à 6 chiffres. Pas de mot de
            passe, et ça crée ton compte si tu n&apos;en as pas encore.
          </p>
          <div>
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              value={email}
              autoFocus
              required
              placeholder="toi@exemple.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-terracotta">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={close}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending || !email.trim()}>
              {pending ? "Envoi…" : "Recevoir le code"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            <MailCheck size={16} className="text-sage" />
            Code envoyé à <strong>{email}</strong>.
          </p>
          <div>
            <Label htmlFor="signin-code">Code à 6 chiffres</Label>
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
              ← Changer d&apos;email
            </button>
            <Button type="submit" disabled={pending || code.length < 6}>
              {pending ? "Vérification…" : "Se connecter"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
