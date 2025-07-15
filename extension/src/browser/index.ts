import { injectable } from "tsyringe"
import type {
  IBrowser,
  ILocalStorage,
  IPermissions,
  IRuntime,
  ITabs,
  IWindows,
} from "./core"
import { BrowserPermissions } from "./permissions"
import { BrowserRuntime } from "./runtime"
import { BrowserStorage } from "./storage"
import { BrowserTabs } from "./tabs"
import { BrowserWindows } from "./windows"

export * from "./core"

@injectable()
export class Browser implements IBrowser {
  public readonly permissions: IPermissions
  public readonly tabs: ITabs
  public readonly windows: IWindows
  public readonly localStorage: ILocalStorage
  public readonly runtime: IRuntime

  constructor() {
    this.permissions = new BrowserPermissions()
    this.tabs = new BrowserTabs()
    this.windows = new BrowserWindows()
    this.localStorage = new BrowserStorage()
    this.runtime = new BrowserRuntime()
  }
}
