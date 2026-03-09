#!/usr/bin/env node

import { getConfig } from '@/core/utils'
import { Watcher } from '@/watcher/Watcher'
import { Command } from 'commander'

const program = new Command()

program.command('watch').action(async() => {
    const configRoot = await getConfig()
    const watcher = new Watcher(configRoot)
    watcher.setupWatch()
})

program.parse()
