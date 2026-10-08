import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  dataUrlBytes,
} from '@/contracts/profile'

/** Side of the stored avatar (square, displayed at up to 70px). */
const AVATAR_SIZE = 256
/** Larger photos are refused before decoding them. */
const SOURCE_MAX_BYTES = 10 * 1024 * 1024

export class AvatarError extends Error {}

function isAvatarType(type: string): type is (typeof AVATAR_TYPES)[number] {
  return (AVATAR_TYPES as readonly string[]).includes(type)
}

/**
 * Turns a picked file into the avatar sent to the API: center-cropped to a
 * square, resized to 256 px and encoded as WebP (a few dozen KB).
 */
export async function prepareAvatar(file: File): Promise<string> {
  if (!isAvatarType(file.type)) {
    throw new AvatarError('Escolha uma imagem PNG, JPG ou WebP.')
  }
  if (file.size > SOURCE_MAX_BYTES) {
    throw new AvatarError('A imagem deve ter no máximo 10 MB.')
  }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new AvatarError('Não foi possível ler esta imagem. Tente outra.')
  }
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context)
    throw new AvatarError('Seu navegador não conseguiu processar a imagem.')
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  )
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/webp', 0.85)
  const bytes = dataUrlBytes(dataUrl)
  if (bytes === null || bytes > AVATAR_MAX_BYTES) {
    throw new AvatarError('A imagem ficou grande demais. Tente outra.')
  }
  return dataUrl
}
