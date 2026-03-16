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
    // MediaQuery => RuleMapArr
    const mediaQueryMap = this.groupClassesByMediaQuery(classNames, root)

    console.log(mediaQueryMap)

    // root.walkAtRules((atRule) => {
    // //   console.log(atRule.params)

    //   const media = mediaParser(atRule.params)

    //   media.nodes.forEach((node) => {
    //     if (node.nodes.length === 0) {
    //         console.log(node.type, ': ')
    //     }
    //   })

    //   //   if (media.type !== 'media-query-list') {
    //   //     return
    //   //   }

    //   //   console.log(media)
    // })

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

  groupClassesByMediaQuery(classNames: string[], root: Root) {
    // MediaQuery => RuleMapArr
    const mediaQueryMap = new Map<string, Map<string, Rule>[]>()

    // Initialize map with CORE, OTHERS
    // CORE will be used to track those classes which are not inside media queries but are mentioned in the JSX
    // OTHERS will be used to track those classes which are not inside media queries and are not mentioned in the JSX
    mediaQueryMap.set('CORE', [])
    mediaQueryMap.set('OTHERS', [])

    const uniqueJSXClasses = [...new Set(classNames)]


    // Loop media queries and get classes
    root.walkAtRules((atRule) => {
      const mediaQuery = atRule.params

      atRule.walkRules((rule) => {
        const selector = this.removeDotPrefix(rule.selector)

        let mediaQueryRules = mediaQueryMap.get(mediaQuery)

        if (!mediaQueryRules) {
          mediaQueryRules = []
        }

        const ruleMap = new Map()

        ruleMap.set(selector, rule)

        mediaQueryRules.push(ruleMap)

        mediaQueryMap.set(mediaQuery, mediaQueryRules)

        rule.remove()
      })

      atRule.remove()
    })

    // Loop individual classes
    root.walkRules((rule) => {
      const selector = this.removeDotPrefix(rule.selector)

      if (uniqueJSXClasses.includes(selector)) {
        // Include in CORE
        const coreArr = mediaQueryMap.get('CORE')
        const ruleMap = new Map()
        ruleMap.set(selector, rule)

        coreArr.push(ruleMap)

        mediaQueryMap.set('CORE', coreArr)
      } else {
        // Include in OTHERS
        const otherArr = mediaQueryMap.get('OTHERS')
        const ruleMap = new Map()
        ruleMap.set(selector, rule)

        otherArr.push(ruleMap)

        mediaQueryMap.set('OTHERS', otherArr)
      }
      rule.remove()
    })

    return mediaQueryMap
  }

  removeDotPrefix(selector: string) {
    return selector.replace(/^\./, '')
  }
}
