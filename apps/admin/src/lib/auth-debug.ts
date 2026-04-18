import "server-only"

import { splitSetCookieHeader } from "better-auth/cookies"

type HeaderReader = Pick<Headers, "get">

function getCookieNames(cookieHeader: string | null): string[] {
  if (!cookieHeader) {
    return []
  }

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter(Boolean)
}

function getSetCookieSummary(setCookieHeader: string | null) {
  if (!setCookieHeader) {
    return []
  }

  return splitSetCookieHeader(setCookieHeader).map((cookie) => {
    const [nameValue, ...attributes] = cookie.split(";").map((part) => part.trim())
    const [name] = nameValue.split("=")
    const attributeMap = new Map(
      attributes.map((attribute) => {
        const [key, ...rest] = attribute.split("=")

        return [key.toLowerCase(), rest.join("=") || true] as const
      }),
    )

    return {
      name,
      domain: attributeMap.get("domain") ?? null,
      path: attributeMap.get("path") ?? null,
      sameSite: attributeMap.get("samesite") ?? null,
      secure: attributeMap.has("secure"),
      httpOnly: attributeMap.has("httponly"),
    }
  })
}

export function getAuthRequestDebugInfo(headers: HeaderReader) {
  return {
    host: headers.get("host"),
    origin: headers.get("origin"),
    referer: headers.get("referer"),
    xForwardedHost: headers.get("x-forwarded-host"),
    xForwardedProto: headers.get("x-forwarded-proto"),
    cookieNames: getCookieNames(headers.get("cookie")),
  }
}

export function getAuthResponseDebugInfo(headers: HeaderReader) {
  return {
    location: headers.get("location"),
    setCookie: getSetCookieSummary(headers.get("set-cookie")),
  }
}

export function getSessionDebugInfo(session: unknown) {
  const authSession = session as
    | {
        session?: { id?: string; expiresAt?: Date | string }
        user?: { id?: string; email?: string }
      }
    | null
    | undefined

  return {
    hasSession: Boolean(authSession),
    sessionId: authSession?.session?.id ?? null,
    sessionExpiresAt:
      authSession?.session?.expiresAt instanceof Date
        ? authSession.session.expiresAt.toISOString()
        : authSession?.session?.expiresAt ?? null,
    userId: authSession?.user?.id ?? null,
    userEmail: authSession?.user?.email ?? null,
  }
}

export function logAuthDebug(scope: string, payload: Record<string, unknown>) {
  console.info(`[auth-debug] ${scope}`, payload)
}
