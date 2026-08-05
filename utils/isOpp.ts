import { MultiOpp, Opportunity } from "@/types";

export function isOpportunity(opp: Opportunity | MultiOpp): opp is Opportunity {
  return 'allow_carpool' in opp;
}

export function isMultiOpp(opp: Opportunity | MultiOpp): opp is MultiOpp {
  return 'days_of_week' in opp || 'week_frequency' in opp;
}