import { checkRunning } from '../electron/main/install'

export interface IInstallStep {
  checkRunning: () => Promise<void>
  checkPath: () => Promise<void>
  backup: () => Promise<void>
  rollback: () => Promise<void>
  extract: () => Promise<void>
  modify: () => Promise<void>
  pack: () => Promise<void>
  quit: () => void
}

declare global {
  interface Window {
    installStep: IInstallStep
  }
}
