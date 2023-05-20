export function versionCompare(a: string, b: string): string {
  const aVersionArray = a.replace(/^app-/, '').split('.')
  const bVersionArray = b.replace(/^app-/, '').split('.')
  for (let i = 0; i < Math.max(aVersionArray.length, bVersionArray.length); i++) {
    if (+aVersionArray[i] === +bVersionArray[i]) {
      if (i === Math.max(aVersionArray.length, bVersionArray.length) - 1) {
        return a
      }
      continue
    }
    if (+aVersionArray[i] > +bVersionArray[i]) {
      return a
    } else {
      return b
    }
  }
  return ''
}
