// @ts-nocheck
"use client"

import { KRAPortal } from "@/components/kra-portal"
import { PageBackground } from "@/components/ui/page-background"
import { Show, RedirectToSignIn } from "@clerk/nextjs"

export default function PortalPage() {
  return (
    <PageBackground>
      <Show when="signed-in">
        <KRAPortal />
      </Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </PageBackground>
  )
}
