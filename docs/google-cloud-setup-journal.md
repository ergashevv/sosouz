# Google Cloud & Google Workspace setup journal (Soso)

> **Purpose:** Chronological record of what was done on Google Cloud / Workspace, inferred from console screenshots and chat. Written so another IDE or AI assistant can resume context without prior conversation.  
> **Language:** English (technical clarity); product names and IDs kept as in Google Console.  
> **Status (as of last update):** Billing **project quota increase** submitted; **awaiting Google response** before Cloud Foundation deploy can finish.

---

## Machine-readable summary (facts)

```yaml
workspace:
  primary_admin_email: info@soso.uz
  domain: soso.uz
  personal_accounts: user has only personal (non-soso.uz) Gmail besides Workspace; no extra @soso.uz users required for solo operation.

google_cloud:
  organization_name: soso.uz
  organization_id: "885327803512"
  billing_account:
    display_name: My Billing Account
    billing_account_id: 01058D-8EDDB1-FB51F9
    status: Active
    linked_organization: soso.uz
  cloud_setup_wizard:
    product: "Google Cloud Setup / Foundation"
    foundation_type_user_discussed: Production-oriented (vs Proof of Concept); user proceeded with multi-environment hierarchy.
    identity_source: "Use Google to centrally manage Google Cloud users" (Workspace / Cloud Identity) — not Azure AD/Okta.
  groups_created: 9
  group_examples:
    - gcp-organization-admins@soso.uz
    - gcp-billing-admins@soso.uz
    - gcp-vpc-network-admins@soso.uz
    - gcp-hybrid-connectivity-admins@soso.uz
    - gcp-logging-monitoring-admins@soso.uz
    - gcp-logging-monitoring-viewers@soso.uz
    - gcp-security-admins@soso.uz
    - gcp-developers@soso.uz
    - gcp-devops@soso.uz
  members_per_group_initially: 1  # likely info@soso.uz only
  hierarchy_style: "Simple, environment-oriented"
  environment_folders:
    - Production
    - Non-Production
    - Development
  common_folder_projects_planned:
    - vpc-host-prod
    - vpc-host-nonprod
    - central-logging-monitoring
  placeholder_service_projects_in_ui:
    - prod1-service, prod2-service
    - nonprod1-service, nonprod2-service
  wizard_steps_completed_per_sidebar:
    - Organization
    - Users & groups
    - Administrative access
    - Billing
    - Hierarchy & access: configuration marked complete; deploy blocked by quota (see below)

quota_blocker:
  issue: "Not enough project quota for automated secure foundation; multiple billing-enabled projects required."
  console_recommendation: at least 12 projects on the linked billing account
  action_taken: Submitted "Google Cloud Platform/API Project: Request Billing Quota Increase" via Google Developers Help
  form_url: https://support.google.com/code/contact/billing_quota_increase
  requested_project_count: 15
  emails_for_project_creation: info@soso.uz
  service_type_selected: Both free and paid services
  reason_dropdown: "Completing Cloud On-boarding setup"
  submission_result: Success page; Trust & Safety typical reply ~2 business days

google_ai_studio:
  user: info@soso.uz
  billing_tier: Paid 1
  billing_account_label: My Billing Account
  project_name_in_studio: soso
  note: "Balance is for both Gemini API service and Cloud services"

application_repo_soso:
  gemini_env: GEMINI_API_KEY in .env (rotating keys if ever leaked is recommended; never commit .env)
  other_google_related_env:
    - YOUTUBE_DATA_API_KEY optional
    - NEXT_PUBLIC_GTM_ID optional

out_of_scope_clarifications:
  alumni_stories_url: https://startup.google.com/alumni/stories/  # marketing / stories, not a grant application form
  startup_programs: separate flow on https://startup.google.com (Programs / Cloud credits, etc.)
```

---

## Timeline (what happened, in order)

1. **Workspace / business identity**  
   - Business Gmail: `info@soso.uz`.  
   - Domain: `soso.uz`.  
   - User chose **not** to create additional `@soso.uz` mailboxes solely for GCP; one admin user is sufficient for a solo founder.

2. **Google Cloud organization**  
   - Organization **`soso.uz`** created.  
   - **Organization ID:** `885327803512`.  
   - Toast/notifications indicated org creation and `info@soso.uz` granted **organization admin** (Super Admin / org admin context).

3. **Cloud Setup wizard — Foundations**  
   - **Foundation type:** Discussion compared *Proof of Concept* (lighter; no central logging/monitoring in that tier’s comparison table) vs *Production* / *Enhanced Security*. User’s screenshots reflect a **full multi-project foundation** path (VPC hosts, central logging, env folders) consistent with **Production-style** landing zone.  
   - **Users & identity:** Selected **“Use Google to centrally manage Google Cloud users”** (Google Workspace / Cloud Identity path).  
   - **Administrative groups:** Used **“Create all groups”** — **9 groups** created (`gcp-organization-admins`, `gcp-billing-admins`, …).  
   - **Users step:** Wizard directed to Google Admin Console for users; for solo setup, existing `info@soso.uz` is enough; optional: add self to relevant `gcp-*` groups for IAM alignment.

4. **Billing**  
   - Billing account **My Billing Account** linked; **Active**; shown under organization `soso.uz`.  
   - **Billing account ID** (for forms/support): `01058D-8EDDB1-FB51F9`.  
   - AI Studio billing: **Paid 1**, postpay, tier cap noted in UI; same billing account family as Gemini + Cloud.

5. **Hierarchy & access**  
   - Chosen: **Simple, environment-oriented hierarchy**.  
   - Folders: **Production**, **Non-Production**, **Development**.  
   - **Common** folder in preview: `vpc-host-prod`, `vpc-host-nonprod`, `central-logging-monitoring`, plus sample service project names in the UI.  
   - IAM preview included group-based roles (e.g. `gcp-developers` with Compute/GKE roles in dev/non-prod).  
   - **Warning:** Existing resources might sit outside the new tree — “View Existing Resources” was called out for later reconciliation if needed.

6. **Quota blocker**  
   - Red banner: insufficient **project quota** on the billing account to create all foundation projects (console asked for **≥12** projects).  
   - **Deploy** of the foundation cannot complete until quota is raised (or foundation type changed to something needing fewer projects — not chosen at last update).

7. **Quota increase request (submitted)**  
   - Form: **Billing Quota Increase** (project count linked to billing account).  
   - **Billing account ID field:** `01058D-8EDDB1-FB51F9`.  
   - **Project count requested:** `15`.  
   - **Emails that create projects:** `info@soso.uz`.  
   - **Reason:** **Completing Cloud On-boarding setup**.  
   - **Services:** Both free and paid.  
   - **Additional context:** Stated org foundation for `soso.uz`, org ID, Shared VPC + logging + env folders, billing ID, legitimate startup use, not reselling projects.  
   - **Outcome:** Confirmation page — **Google Cloud Platform Trust & Safety** to respond (typically ~2 business days).

---

## What was explicitly *not* done yet (defer / pending)

- **Foundation deploy** (Terraform or console deploy step) — **waiting** on quota approval.  
- **Organization dropdown** in Billing overview sometimes showed **“None selected”** while the account row still listed org `soso.uz` — optional cleanup: select `soso.uz` in the org picker for consistent navigation.  
- **Startup grant application** — separate from quota; not completed in this journal.  
- **No code changes** in this repo were required for the GCP wizard itself; app continues to use `GEMINI_API_KEY` etc. in `.env`.

---

## How another assistant should use this doc

- **To resume GCP work:** Check email for quota approval → return to **Google Cloud Setup** → complete remaining steps (Security, logging/monitoring, VPC, hybrid connectivity, deploy/download) as the wizard shows.  
- **If still blocked:** Re-read console error: distinguish **billing-linked project quota** (this form) vs **organization project quota** (different Google support path linked from the same help family).  
- **Security:** Treat `billing_account_id` and `organization_id` as sensitive operational identifiers; rotate API keys if they ever appear in chat, screenshots, or git history.

---

## Uzbek qisqa xulosa

- **qilgan ish:** `soso.uz` tashkiloti, 9 ta `gcp-*` guruh, billing ulangan, foundation uchun **prod / non-prod / dev** tuzilmasi tanlangan, **loyiha kvotasi** yetmagani sababli **billing project quota** oshirish so‘rovi yuborilgan.  
- **hozir:** kvota javobini kutish; kelgach foundation **deploy** yakunlanadi.  
- **grant / startup.google.com** — alohida jarayon; alumni “stories” sahifasi grant emas.
