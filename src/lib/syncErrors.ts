export type SyncFailure = {
  kind: 'missing-connection' | 'error'
  message: string
}

export async function readSyncFailure(response: Response): Promise<SyncFailure> {
  let responseText = ''
  try {
    responseText = await response.text()
  } catch {
    // Keep the HTTP status as the fallback detail.
  }

  let serverMessage = ''
  if (responseText) {
    try {
      const body: unknown = JSON.parse(responseText)
      if (typeof body === 'object' && body !== null) {
        for (const key of ['message', 'detail', 'error', 'title']) {
          const value = body[key as keyof typeof body]
          if (typeof value === 'string' && value !== 'Internal Server Error') {
            serverMessage = value
            break
          }
        }
      }
    } catch {
      serverMessage = responseText
    }
  }

  if (/no plaid item connected|no (?:bank|plaid) connection|connection (?:is )?missing|not connected/i.test(serverMessage)) {
    return {
      kind: 'missing-connection',
      message: 'The server reports that no bank connection is saved. Connect a bank, then retry this sync.',
    }
  }

  return {
    kind: 'error',
    message: serverMessage
      ? `Sync failed (${response.status}): ${serverMessage}`
      : `Sync failed (${response.status}).`,
  }
}