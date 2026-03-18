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

    // Loop media queries and get classes
    this.extractAtRules(root, uniqueJSXClasses, baseCssMap)
    this.extractRules(root, uniqueJSXClasses, baseCssMap)

    return baseCssMap
  }

  extractAtRules(root: Root, uniqueJSXClasses: string[], baseCssMap: BaseCssMapType) {
    root.walkAtRules((atRule) => {
      const mediaQuery = atRule.params

      // console.log(atRule.name, ' : ', atRule.params)

      // Ensure mediaQuery map exists
      if (!baseCssMap.has(mediaQuery)) {
        const ruleTypeMap: RuleTypeMap = new Map([
          ['CORE', new Map()],
          ['OTHER', new Map()]
        ])

        baseCssMap.set(mediaQuery, ruleTypeMap)
      }

      const ruleTypeMap = baseCssMap.get(mediaQuery)

      atRule.walkRules((rule) => {
        const selector = this.removeDotPrefix(rule.selector)

        const ruleType = uniqueJSXClasses.includes(selector) ? 'CORE' : 'OTHER'

        const ruleMap = ruleTypeMap.get(ruleType)

        ruleMap.set(selector, rule)

        ruleTypeMap.set(ruleType, ruleMap)

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

      baseCssMap.set('INDIVIDUAL', ruleTypeMap)
    }

    const individualMap = baseCssMap.get('INDIVIDUAL')!

    // Loop individual classes
    root.walkRules((rule) => {
      if (rule.parent?.type === 'atrule') return

      const selector = this.removeDotPrefix(rule.selector)

      const ruleType = uniqueJSXClasses.includes(selector) ? 'CORE' : 'OTHER'

      const ruleMap = individualMap.get(ruleType)!

      ruleMap.set(selector, rule)

      individualMap.set(ruleType, ruleMap)

      rule.remove()
    })
  }

  appendBaseMap(baseCssMap: BaseCssMapType, uniqueJSXClasses: string[], root: Root) {
    const breakPointArr = ['INDIVIDUAL', ...this.breakpoints]
    const addedBreakpoints = []

    breakPointArr.forEach((breakpoint) => {
      this.addBreakpointClassesToRoot(baseCssMap, uniqueJSXClasses, root, breakpoint)

      addedBreakpoints.push(breakpoint)
    })

    // TODO: Find queries not in breakPointarr and append them to end
    for (const [breakpoint] of baseCssMap) {
      if (!addedBreakpoints.includes(breakpoint)) {
        this.addBreakpointClassesToRoot(baseCssMap, uniqueJSXClasses, root, breakpoint)
        addedBreakpoints.push(breakpoint)
      }
    }
  }

  addBreakpointClassesToRoot(
    baseCssMap: BaseCssMapType,
    uniqueJSXClasses: string[],
    root: Root,
    breakpoint: string | number
  ) {
    const mediaQueryParam = this.getMediaQueryParamForBreakpoint(breakpoint)

    const ruleTypeMap = baseCssMap.get(mediaQueryParam)

    // Append individual classes directly to root
    if (mediaQueryParam === 'INDIVIDUAL') {
      this.appendClasses(ruleTypeMap, uniqueJSXClasses, root, mediaQueryParam)
      return
    }

    const mediaQueryRoot = new AtRule({ name: 'media', params: mediaQueryParam, nodes: [] })

    // If no classes exist for mediaQuery, just append to root and go to next breakpoint
    if (!ruleTypeMap) {
      root.append(mediaQueryRoot)
      return
    }

    this.appendClasses(ruleTypeMap, uniqueJSXClasses, mediaQueryRoot, mediaQueryParam)
    root.append(mediaQueryRoot)
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
