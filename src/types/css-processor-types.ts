import { Rule } from 'postcss'

type RuleType = 'CORE' | 'OTHER'

type RuleMap = Map<string, Rule>
export type RuleTypeMap = Map<RuleType, RuleMap>

type BaseCssEntry = {
  ruleTypeMap: RuleTypeMap
  atRuleName?: string
}

export type BaseCssMapType = Map<string, BaseCssEntry>
