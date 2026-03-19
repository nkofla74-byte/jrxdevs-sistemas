export function getDeviceId(): string {
  const stored = localStorage.getItem('jrx_device_id')
  if (stored) return stored

  const newDeviceId = generateDeviceId()
  localStorage.setItem('jrx_device_id', newDeviceId)
  return newDeviceId
}

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 12)
  const userAgent = btoa(navigator.userAgent).substring(0, 10)
  return `${timestamp}-${random}-${userAgent}`
}

export function clearDeviceId(): void {
  localStorage.removeItem('jrx_device_id')
}