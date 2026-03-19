import { configType } from '@/types/congif-types'
import { BaseCssMapType, RuleTypeMap } from '@/types/css-processor-types'
import postcss, { AtRule, Root, Rule } from 'postcss'

export class CSSProcessor {
  config: configType
  breakpoints: number[]
  constructor(config: configType) {
    this.config = config
    this.breakpoints = config['breakPoints']
  }

  processCss(rawCss: string, cssFilePath: string, modifiedClasses: string[]) {
    const root = postcss.parse(rawCss, { from: cssFilePath })

    this.syncInOrder(modifiedClasses, root)

    return root.toResult()
  }

  // The aim for now is to preserve classes that are not in use inside the jsx
  // Could expose (preserving / not preserving) as a boolean to the config later on
  syncInOrder(classNames: string[], root: Root) {
    const uniqueJSXClasses = [...new Set(classNames)]
    const baseCssMap = this.groupClassesByMediaQuery(uniqueJSXClasses, root)

    console.log(baseCssMap)
    // Reinsert based on the jsx order

    this.appendBaseMap(baseCssMap, uniqueJSXClasses, root)
  }

  groupClassesByMediaQuery(uniqueJSXClasses: string[], root: Root) {
    // CORE will be used to track those classes that are mentioned in the JSX
    // OTHERS will be used to track those classes that are not mentioned in the JSX

    // MediaQuery => RuleType (CORE/OTHER) => RuleMapArr

    const baseCssMap: BaseCssMapType = new Map()

    this.initializeBaseCssMap(baseCssMap)

    // Loop media queries and get classes
    this.extractAtRules(root, uniqueJSXClasses, baseCssMap)
    this.extractRules(root, uniqueJSXClasses, baseCssMap)

    return baseCssMap
  }

  initializeBaseCssMap(baseCssMap: BaseCssMapType) {
    ['INDIVIDUAL', ...this.breakpoints].forEach((breakpoint) => {
      const mediaQueryParam = this.getMediaQueryParamForBreakpoint(breakpoint)
      const ruleTypeMap: RuleTypeMap = new Map([
        ['CORE', new Map()],
        ['OTHER', new Map()]
      ])

      baseCssMap.set(mediaQueryParam, { ruleTypeMap, atRuleName: 'media' })
    })
  }

  extractAtRules(root: Root, uniqueJSXClasses: string[], baseCssMap: BaseCssMapType) {
    root.walkAtRules((atRule) => {
      const mediaQuery = atRule.params

      // Ensure mediaQuery map exists
      if (!baseCssMap.has(mediaQuery)) {
        const ruleTypeMap: RuleTypeMap = new Map([
          ['CORE', new Map()],
          ['OTHER', new Map()]
        ])

        baseCssMap.set(mediaQuery, { ruleTypeMap, atRuleName: atRule.name })
      }

      const entry = baseCssMap.get(mediaQuery)

      atRule.walkRules((rule) => {
        const selector = this.removeDotPrefix(rule.selector)

        const ruleType = uniqueJSXClasses.includes(selector) ? 'CORE' : 'OTHER'

        const ruleMap = entry?.ruleTypeMap.get(ruleType)

        ruleMap.set(selector, rule)

        entry?.ruleTypeMap.set(ruleType, ruleMap)

        rule.remove()
      })

      atRule.remove()
    })
  }

  extractRules(root: Root, uniqueJSXClasses: string[], baseCssMap: BaseCssMapType) {
    if (!baseCssMap.has('INDIVIDUAL')) {
      const ruleTypeMap: RuleTypeMap = new Map([
        ['CORE', new Map()],
        ['OTHER', new Map()]
      ])

      baseCssMap.set('INDIVIDUAL', { ruleTypeMap })
    }

    const entry = baseCssMap.get('INDIVIDUAL')!

    // Loop individual classes
    root.walkRules((rule) => {
      if (rule.parent?.type === 'atrule') return

      const selector = this.removeDotPrefix(rule.selector)

      const ruleType = uniqueJSXClasses.includes(selector) ? 'CORE' : 'OTHER'

      const ruleMap = entry?.ruleTypeMap.get(ruleType)!

      ruleMap.set(selector, rule)

      entry?.ruleTypeMap.set(ruleType, ruleMap)

      rule.remove()
    })
  }

  appendBaseMap(baseCssMap: BaseCssMapType, uniqueJSXClasses: string[], root: Root) {
    for (const [breakpoint] of baseCssMap) {
      this.addBreakpointClassesToRoot(baseCssMap, uniqueJSXClasses, root, breakpoint)
    }
  }

  addBreakpointClassesToRoot(
    baseCssMap: BaseCssMapType,
    uniqueJSXClasses: string[],
    root: Root,
    breakpoint: string | number
  ) {
    const mediaQueryParam = this.getMediaQueryParamForBreakpoint(breakpoint)

    const entry = baseCssMap.get(mediaQueryParam)
    const ruleTypeMap = entry?.ruleTypeMap

    // Append individual classes directly to root
    if (mediaQueryParam === 'INDIVIDUAL') {
      this.appendClasses(ruleTypeMap, uniqueJSXClasses, root, mediaQueryParam)
      return
    }

    const atRuleName = entry?.atRuleName

    let atRule: AtRule

    if (atRuleName) {
      atRule = new AtRule({ name: atRuleName, params: mediaQueryParam, nodes: [] })
    } else {
      atRule = new AtRule({ name: 'media', params: mediaQueryParam, nodes: [] })
    }

    // If no classes exist for mediaQuery, just append to root and go to next breakpoint
    if (!ruleTypeMap) {
      root.append(atRule)
      return
    }

    this.appendClasses(ruleTypeMap, uniqueJSXClasses, atRule, mediaQueryParam)
    root.append(atRule)
  }

  appendClasses(mediaQuery: RuleTypeMap, uniqueJSXClasses: string[], root: Root | AtRule, mediaQueryParam: string) {
    const coreRules = mediaQuery.get('CORE')
    const otherRules = mediaQuery.get('OTHER')

    uniqueJSXClasses.forEach((selector) => {
      if (coreRules.has(selector)) {
        // If class existed before, then use the same one
        root.append(coreRules.get(selector))
        coreRules.delete(selector)
      } else {
        if (mediaQueryParam === 'INDIVIDUAL') {
          // If no existing class, then add a new empty class.
          // Only for individual classes. Maybe add to config
          const newRule = new Rule({ selector: `.${selector}` })
          root.append(newRule)
        }
      }
    })

    otherRules.forEach((rule) => {
      root.append(rule)
    })
  }

  getMediaQueryParamForBreakpoint(breakpoint: string | number) {
    if (breakpoint === 'INDIVIDUAL') {
      return 'INDIVIDUAL'
    }

    // For any other media queries that are not in the config
    if (typeof breakpoint === 'string') {
      return breakpoint
    }

    return `(min-width: ${breakpoint}px)`
  }

  removeDotPrefix(selector: string) {
    return selector.replace(/^\./, '')
  }
}
