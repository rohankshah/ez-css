import postcss, { Root, Rule } from 'postcss'
import mediaParser from 'postcss-media-query-parser'

export class CSSProcessor {
  constructor() {}

  processCss(rawCss: string, cssFilePath: string, modifiedClasses: string[]) {
    const root = postcss.parse(rawCss, { from: cssFilePath })

    this.syncInOrder(modifiedClasses, root)

    return root.toResult()
  }

  // The aim for now is to preserve classes that are not in use inside the jsx
  // Could expose this to the config later on
  syncInOrder(classNames: string[], root: Root) {
    const uniqueJSXClasses = [...new Set(classNames)]
    const mediaQueryMap = this.groupClassesByMediaQuery(uniqueJSXClasses, root)

    console.log(mediaQueryMap)
    // Reinsert based on the jsx order

    // uniqueJSXClasses.forEach((name) => {
    //   if (ruleMap.has(name)) {
    //     // If class existed before, then use the same one
    //     root.append(ruleMap.get(name))
    //     ruleMap.delete(name)
    //   } else {
    //     // If no existing class, then add a new empty class
    //     const newRule = new Rule({ selector: `.${name}` })
    //     root.append(newRule)
    //   }
    // })

    // // Add remaining classes at the bottom
    // ruleMap.forEach((rule) => {
    //   root.append(rule)
    // })
  }

  groupClassesByMediaQuery(uniqueJSXClasses: string[], root: Root) {
    // CORE will be used to track those classes that are mentioned in the JSX
    // OTHERS will be used to track those classes that are not mentioned in the JSX

    // MediaQuery => RuleType (CORE/OTHER) => RuleMapArr
    const mediaQueryMap = new Map<string, Map<string, Map<string, Rule>[]>>()

    // Loop media queries and get classes
    this.extractAtRules(root, uniqueJSXClasses, mediaQueryMap)
    this.extractRules(root, uniqueJSXClasses, mediaQueryMap)

    return mediaQueryMap
  }

  extractAtRules(root: Root, uniqueJSXClasses: string[], mediaQueryMap: Map<string, Map<string, Map<string, Rule>[]>>) {
    root.walkAtRules((atRule) => {
      const mediaQuery = atRule.params

      // Ensure mediaQuery map exists
      if (!mediaQueryMap.has(mediaQuery)) {
        mediaQueryMap.set(
          mediaQuery,
          new Map<string, Map<string, Rule>[]>([
            ['CORE', []],
            ['OTHER', []]
          ])
        )
      }

      const ruleTypeMap = mediaQueryMap.get(mediaQuery)

      atRule.walkRules((rule) => {
        const selector = this.removeDotPrefix(rule.selector)

        const ruleType = uniqueJSXClasses.includes(selector) ? 'CORE' : 'OTHER'

        const ruleMapArr = ruleTypeMap.get(ruleType)!

        const ruleMap = new Map<string, Rule>()
        ruleMap.set(selector, rule)

        ruleMapArr.push(ruleMap)

        // rule.remove()
      })
    })
  }

  extractRules(root: Root, uniqueJSXClasses: string[], mediaQueryMap: Map<string, Map<string, Map<string, Rule>[]>>) {
    if (!mediaQueryMap.has('INDIVIDUAL')) {
      mediaQueryMap.set(
        'INDIVIDUAL',
        new Map([
          ['CORE', []],
          ['OTHER', []]
        ])
      )
    }

    const individualMap = mediaQueryMap.get('INDIVIDUAL')!

    // Loop individual classes
    root.walkRules((rule) => {
      if (rule.parent?.type === 'atrule') return

      const selector = this.removeDotPrefix(rule.selector)

      const ruleType = uniqueJSXClasses.includes(selector) ? 'CORE' : 'OTHER'

      const ruleArr = individualMap.get(ruleType)!

      const ruleMap = new Map<string, Rule>()
      ruleMap.set(selector, rule)

      ruleArr.push(ruleMap)

      // rule.remove()
    })
  }

  removeDotPrefix(selector: string) {
    return selector.replace(/^\./, '')
  }
}
