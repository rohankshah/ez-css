import { Rule } from 'postcss'

type RuleType = 'CORE' | 'OTHER'

type RuleMap = Map<string, Rule>
export type RuleTypeMap = Map<RuleType, RuleMap>
export type BaseCssMapType = Map<string, RuleTypeMap>
