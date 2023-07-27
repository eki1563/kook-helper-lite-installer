import { homedir } from 'os'
import { resolve } from 'node:path'
import fs from 'fs'
import ps from 'ps-node'
import { versionCompare } from '../utils'

const asar = require('@electron/asar')

const home = process.env.HOME || homedir()
const defaultInstallPath = resolve(home, 'AppData', 'Local', 'KOOK')
let extractPath = ''
let latestVersion = 'app-0.0.0'
let resourcePath = ''

export function checkPath() {
  return new Promise((resolve1, reject1) => {
    if (fs.existsSync(defaultInstallPath)) {
      const dirs = fs.readdirSync(defaultInstallPath).filter(dir => /^app-\d+\.\d+\.\d+$/.test(dir))
      if (!dirs.length) {
        reject1(new Error('默认安装路径未发现 KOOK！'))
      }
      for (let i = 0; i < dirs.length; i++) {
        latestVersion = versionCompare(dirs[i], latestVersion)
      }
      resourcePath = resolve(defaultInstallPath, latestVersion, 'resources')
      extractPath = resolve(resourcePath, 'dist')
      resolve1(latestVersion)
    } else {
      reject1(new Error('默认安装路径未发现 KOOK！'))
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
  return new Promise((resolve1, reject1) => {
    const asarPath = resolve(resourcePath, 'app.asar')
    asar.createPackageWithOptions(extractPath, asarPath, { unpackDir: '**/{detect-fullscreen,node-audio-ai-helper,node-audio-ai-helper-old,node-avhook,node-checkadmin,node-desktop-capture,node-process-windows,node-windows-helper,window-node-km-event,window-volume-control,node-screenshot,agora-electron-sdk}' })
      .then(() => {
        resolve1(void 0)
      })
      .catch(e => {
        reject1(e)
      })
  })
}
