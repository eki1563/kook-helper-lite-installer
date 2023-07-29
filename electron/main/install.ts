import { resolve } from 'node:path'
import fs from 'fs'
import ps from 'ps-node'

const asar = require('@electron/asar')
const regedit = require('regedit').promisified

let extractPath = ''
let latestVersion = 'app-0.0.0'
let resourcePath = ''

export function checkPath() {
  return new Promise(async (resolve1, reject1) => {
    const key = `HKCU\\Software\\Classes\\kook\\shell\\open\\command`
    const listResult = await regedit.list([key])
    if (listResult[key].exists) {
      const fullPath = listResult[key].values[''].value.replace(/^"(.*?)".*"$/, '$1')
      const path = fullPath.replace(/\\KOOK\.exe/i, '')
      if (fs.existsSync(path)) {
        resourcePath = resolve(path, 'resources')
        extractPath = resolve(resourcePath, 'dist')
        latestVersion = path.replace(/.*(app-\d+\.\d+\.\d+)/, '$1')
        resolve1(latestVersion)
      } else {
        reject1(new Error('未发现 KOOK 安装路径！'))
      }
    } else {
      reject1(new Error('未发现 KOOK 安装路径！'))
    }
  })
}

export function checkRunning() {
  return new Promise((resolve1, reject1) => {
    try {
      ps.lookup({
        command: 'KOOK',
      }, (err, list) => {
        if (err) {
          reject1(err)
        } else {
          const kookProcess = list.filter(item => !item.command.includes('kook-helper-lite-installer'))
          if (kookProcess.length > 0) {
            reject1(new Error('KOOK 正在运行！请先关闭 KOOK。'))
          } else {
            resolve1(void 0)
          }
        }
      })
    } catch (e) {
      reject1(e)
    }
  })
}

export function backup() {
  return new Promise((resolve1, reject1) => {
    process.noAsar = true
    const backupResources = [
      'app.asar',
      'app.asar.unpacked',
    ]
    try {
      backupResources.forEach(resourceName => {
        const src = resolve(resourcePath, resourceName)
        const dst = resolve(resourcePath, `${ resourceName }-bak`)
        if (fs.existsSync(dst)) {
          return
        }
        if (fs.existsSync(src)) {
          const stat = fs.statSync(src)
          if (stat.isFile()) {
            fs.cpSync(src, dst)
          } else if (stat.isDirectory()) {
            fs.cpSync(src, dst, { recursive: true })
          }
        }
      })
      resolve1(void 0)
    } catch (e) {
      reject1(e)
    }
  })
}

export function rollback() {
  return new Promise((resolve1, reject1) => {
    process.noAsar = true
    const backupResources = [
      'app.asar-bak',
      'app.asar.unpacked-bak',
    ]
    try {
      backupResources.forEach(resourceName => {
        const src = resolve(resourcePath, resourceName)
        const dst = resolve(resourcePath, `${ resourceName.replace(/-bak$/, '') }`)
        if (fs.existsSync(src)) {
          const stat = fs.statSync(src)
          if (stat.isFile()) {
            fs.cpSync(src, dst)
          } else if (stat.isDirectory()) {
            fs.cpSync(src, dst, { recursive: true })
          }
        }
      })
      resolve1(void 0)
    } catch (e) {
      reject1(e)
    }
  })
}

export function extract() {
  return new Promise((resolve1, reject1) => {
    process.noAsar = true
    const asarPath = resolve(resourcePath, 'app.asar')
    try {
      if (fs.existsSync(asarPath)) {
        asar.extractAll(asarPath, extractPath)
        resolve1(void 0)
      }
    } catch (e) {
      reject1(e)
    }
  })
}

export function modify() {
  return new Promise((resolve1, reject1) => {
    try {
      const indexHtmlPath = resolve(extractPath, 'webapp', 'build', 'index.htm')
      if (fs.existsSync(indexHtmlPath)) {
        let content = fs.readFileSync(indexHtmlPath).toString()
        content = content.replace('</body>', '<script src="https://khl.eki1563.top/index.js" type="module"></script></body>')
        fs.writeFileSync(indexHtmlPath, content)
        resolve1(void 0)
      }
    } catch (e) {
      reject1(e)
    }
  })
}

export async function pack() {
  const asarPath = resolve(resourcePath, 'app.asar')
  return new Promise((resolve1, reject1) => {
    const unpacked = [
      resolve(resourcePath, 'app.asar.unpacked', 'src', 'addon'),
      resolve(resourcePath, 'app.asar.unpacked', 'src', 'screenshot'),
      resolve(resourcePath, 'app.asar.unpacked', 'node_modules'),
    ]
    const unpackedDirName = []
    unpacked.forEach(p => {
      if (fs.existsSync(p)) {
        unpackedDirName.push(...fs.readdirSync(p))
      }
    })
    asar.createPackageWithOptions(extractPath, asarPath, { unpackDir: `**/{${ unpackedDirName.join(',') }}` })
      .then(() => {
        resolve1(void 0)
      })
      .catch(e => {
        reject1(e)
      })
  })
}
