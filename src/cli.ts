#!/usr/bin/env node

import { FileProcessor } from '@/FileProcessor/FileProcessor'
import { JSXParser } from '@/JSXParser/JSXParser'
import { Watcher } from '@/Watcher/Watcher'
import { CSSProcessor } from '@/CSSProcessor/CSSProcessor'
import { getConfig } from '@/core/utils/utils'
import { Command } from 'commander'

const program = new Command()

program.command('watch').action(async () => {
  const jsxParser = new JSXParser()

  const configData = await getConfig()

  const cssProcessor = new CSSProcessor(configData)

  const fileProcessor = new FileProcessor(jsxParser, cssProcessor)
  const watcher = new Watcher(configData, fileProcessor)

  watcher.setupWatch()
})

program.parse()
