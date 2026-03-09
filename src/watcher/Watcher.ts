import { getClassesForFile } from '@/core/jsxParser'
import { checkIfFileExists, createEmptyFile } from '@/core/utils'
import { parse } from '@babel/parser'
import chokidar, { FSWatcher } from 'chokidar'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import postcss, { Root, Rule } from 'postcss'

export class Watcher {
  configRoot: string | null
  watcher: FSWatcher | null

  constructor(configRoot: string) {
    this.configRoot = configRoot
    this.init()
  }

  init() {
    this.watcher = chokidar.watch(this.configRoot, { ignored: /node_modules/, persistent: true })
  }

  setupWatch() {
    if (!this.watcher) return

    this.watcher.on('change', this.watchHandler.bind(this))
  }

  async watchHandler(filePath: string) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
      const fileData = await readFile(filePath, 'utf8')

      const ast = parse(fileData, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      })

      const classes = getClassesForFile(ast)

      const cssFilePath = filePath.replace(path.extname(filePath), '.css')

      // Check if css file exists, if not then create one
      const cssFileExists = await checkIfFileExists(cssFilePath)

      if (!cssFileExists) {
        await createEmptyFile(cssFilePath)
      }

      // Read css file
      const cssFileDataRaw = await readFile(cssFilePath, 'utf8')

      const root = postcss.parse(cssFileDataRaw, { from: cssFilePath })

      this.syncInOrder(classes, root)

      const result = root.toResult()

      await writeFile(cssFilePath, result.css, 'utf8')

    }
  }

  // The aim for now is to preserve
  syncInOrder(classNames: string[], root: Root) {
    const ruleMap = new Map<string, Rule>()
    const uniqueJSXClasses = [...new Set(classNames)]

    // Store classes from jsx that already exist in css file
    root.walkRules((rule) => {
      const name = rule.selector.replace(/^\./, '')
      if (uniqueJSXClasses.includes(name)) {
        ruleMap.set(name, rule)
      }
      rule.remove()
    })

    // Reinsert based on the jsx order
    uniqueJSXClasses.forEach((name) => {
      if (ruleMap.has(name)) {
        // If class existed before, then use the same one
        root.append(ruleMap.get(name))
        ruleMap.delete(name)
      } else {
        // If no existing class, then add a new empty class
        const newRule = new Rule({ selector: `.${name}` })
        root.append(newRule)
      }
    })

    // Add remaining classes at the bottom
    ruleMap.forEach((rule) => {
      root.append(rule)
    })
  }
}
