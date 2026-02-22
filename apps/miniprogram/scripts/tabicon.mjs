import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'

import sharp from 'sharp'

const require = createRequire(import.meta.url)

const NORMAL_COLOR = 'oklch(87.2% 0.01 258.338)'
const ACTIVE_COLOR = 'oklch(64.5% 0.246 16.439)'
const DEFAULT_SIZE_PX = 48

const OKLCH_PATTERN = /^oklch\(\s*([0-9]*\.?[0-9]+)%\s+([0-9]*\.?[0-9]+)\s+(-?[0-9]*\.?[0-9]+)(?:\s*\/\s*([0-9]*\.?[0-9]+%?))?\s*\)$/i

function toKebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function normalizeOutputBase(rawOutputName) {
  const normalized = rawOutputName.replace(/^\/+/, '').replace(/\.png$/i, '')

  if (!normalized) {
    throw new Error('Output name is empty. Example: home or tabbar/home')
  }

  if (normalized.includes('/')) {
    return normalized
  }

  return `tabbar/${normalized}`
}

function normalizeSize(rawSize) {
  if (!rawSize) {
    return DEFAULT_SIZE_PX
  }

  const parsed = Number.parseInt(rawSize, 10)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid size: ${rawSize}. Size must be a positive integer.`)
  }

  return parsed
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

function linearToSrgb(value) {
  if (value <= 0.0031308) {
    return 12.92 * value
  }

  return 1.055 * value ** (1 / 2.4) - 0.055
}

function channelToHex(value) {
  const byte = Math.round(clamp01(value) * 255)
  return byte.toString(16).padStart(2, '0')
}

function oklchToHex(lightnessPercent, chroma, hueDegrees) {
  const lightness = lightnessPercent / 100
  const hue = (hueDegrees * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)

  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b

  const l = lPrime ** 3
  const m = mPrime ** 3
  const s = sPrime ** 3

  const rLinear = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  const r = linearToSrgb(clamp01(rLinear))
  const g = linearToSrgb(clamp01(gLinear))
  const blue = linearToSrgb(clamp01(bLinear))

  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(blue)}`
}

function resolveSvgColor(color) {
  const oklchMatch = color.trim().match(OKLCH_PATTERN)

  if (!oklchMatch) {
    return color
  }

  const lightnessPercent = Number(oklchMatch[1])
  const chroma = Number(oklchMatch[2])
  const hueDegrees = Number(oklchMatch[3])

  return oklchToHex(lightnessPercent, chroma, hueDegrees)
}

async function assertReadable(filePath) {
  try {
    const fileStat = await stat(filePath)
    return fileStat.isFile()
  } catch {
    return false
  }
}

function colorizeSvg(svgSource, color) {
  const svgColor = resolveSvgColor(color)
  if (svgSource.includes('currentColor')) {
    return svgSource.replaceAll('currentColor', svgColor)
  }

  return svgSource.replace('<svg ', `<svg color="${svgColor}" `)
}

async function renderPng(svgSource, outputPath, size) {
  const pngBuffer = await sharp(Buffer.from(svgSource))
    .resize(size, size, { fit: 'contain' })
    .png()
    .toBuffer()

  await writeFile(outputPath, pngBuffer)
}

async function main() {
  const [, , rawIconName, rawOutputName, rawSize] = process.argv

  if (!rawIconName || !rawOutputName) {
    throw new Error('Usage: pnpm tabicon <lucide-icon-name> <tab-icon-name> [size-px]')
  }

  const iconName = toKebabCase(rawIconName)
  const outputBase = normalizeOutputBase(rawOutputName)
  const size = normalizeSize(rawSize)

  const lucidePackagePath = require.resolve('lucide-static/package.json')
  const lucideRoot = path.dirname(lucidePackagePath)
  const svgPath = path.join(lucideRoot, 'icons', `${iconName}.svg`)

  if (!(await assertReadable(svgPath))) {
    throw new Error(`Lucide icon not found: ${iconName}`)
  }

  const cwd = process.cwd()
  const publicDir = path.join(cwd, 'public')
  const normalPath = path.join(publicDir, `${outputBase}.png`)
  const activePath = path.join(publicDir, `${outputBase}-active.png`)

  await mkdir(path.dirname(normalPath), { recursive: true })

  const svgSource = await readFile(svgPath, 'utf8')
  const normalSvg = colorizeSvg(svgSource, NORMAL_COLOR)
  const activeSvg = colorizeSvg(svgSource, ACTIVE_COLOR)

  await renderPng(normalSvg, normalPath, size)
  await renderPng(activeSvg, activePath, size)

  process.stdout.write(
    [
      `Generated ${iconName}.svg -> ${path.relative(cwd, normalPath)}`,
      `Generated ${iconName}.svg -> ${path.relative(cwd, activePath)}`,
      `Colors: normal=${NORMAL_COLOR}, active=${ACTIVE_COLOR}`,
      `Size: ${size}x${size}`,
    ].join('\n') + '\n',
  )
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
