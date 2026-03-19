export async function uploadImage(file: File, folder: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
  formData.append('folder', `jrxdevs/${folder}`)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) throw new Error('Error al subir imagen')

  const data = await response.json()
  return data.secure_url
}

export function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      // Máximo 800px de ancho
      const maxWidth = 800
      const ratio = Math.min(maxWidth / img.width, 1)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file)
          const compressed = new File([blob], file.name, { type: 'image/jpeg' })
          resolve(compressed)
        },
        'image/jpeg',
        0.75 // calidad 75%
      )
    }

    img.src = URL.createObjectURL(file)
  })
}