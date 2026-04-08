# SOSO Product Focus Plan

This document locks the current primary strategy so roadmap decisions stay focused.

## 1) Primary differentiation

SOSO is not a generic AI chatbot. The product differentiates through:

- country-scoped recommendations constrained to SOSO university catalog,
- official-link-first UX with freshness and trust cues,
- multilingual guidance (UZ/EN/RU) for study-abroad decisions,
- one decision flow: discovery -> profile -> advisor -> official action.

## 2) Trust layer commitments

- Always surface official links where available.
- Show data freshness and confidence context in university profiles.
- Keep explicit reminder to verify fees/deadlines on official sites.
- Collect user feedback on advisor answers to catch low-quality guidance faster.

## 3) Outcome metrics (north-star and support)

Primary north-star:

- `Qualified official click-through rate`:
  users who open official apply/program/tuition links after profile/advisor interactions.

Supporting metrics:

- searches started per active session,
- profile opens per active session,
- advisor messages per active session,
- official-link clicks per active session.

## 4) Funnel definition

1. Discovery: search started
2. Evaluation: university profile opened
3. Guidance: advisor message sent
4. Action: official link clicked

Current event names in code:

- `soso_discovery_search_started`
- `soso_profile_opened`
- `soso_chat_message_sent`
- `soso_official_link_clicked`
- `soso_chat_feedback_submitted`

## 5) Monetization focus (single primary model)

Primary model (now): **B2B lead-generation / partner-intent pipeline**.

Why this is primary:

- aligns with high-intent student actions already tracked in funnel,
- no immediate paywall friction for early growth,
- measurable value to partners via qualified official-intent events.

Secondary models (later, not primary now):

- B2C premium advisor features,
- sponsored placements with strict trust labeling.

## 6) Data moat execution

- Capture structured advisor feedback per assistant response.
- Link outcomes to country, conversation, and intent events.
- Use this loop to tune prompts/ranking filters and reduce bad recommendations.
