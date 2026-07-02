"use client"

import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center gap-2 self-center text-center">
        <Image src="/logo.svg" alt="Mercury Marketing Logo" width={64} height={64} className="h-16 w-16 object-contain" />
        <span className="font-semibold text-xl text-ink mt-2">Mercury Marketing</span>
        <span className="text-sm text-ink-muted">Modern operations, simplified tracking.</span>
      </div>
      <LoginForm />
    </div>
  )
}
