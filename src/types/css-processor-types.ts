import { Rule } from 'postcss'

// CORE will be used to track those classes that are mentioned in the JSX
// OTHERS will be used to track those classes that are not mentioned in the JSX
type RuleType = 'CORE' | 'OTHER'

type RuleMap = Map<string, Rule>
export type RuleTypeMap = Map<RuleType, RuleMap>

type BaseCssEntry = {
  ruleTypeMap: RuleTypeMap
  atRuleName?: string
}

export type BaseCssMapType = Map<string, BaseCssEntry>
