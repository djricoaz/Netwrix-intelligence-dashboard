Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do

      # === GLOBAL DASHBOARD ===
      get  "dashboard/summary",       to: "dashboard#summary"
      get  "dashboard/alerts",        to: "dashboard#alerts"
      get  "dashboard/kpis",          to: "dashboard#kpis"
      get  "dashboard/breach_score",  to: "dashboard#breach_score"

      # === MODULE 1: ACTIVE DIRECTORY (on-prem) ===
      namespace :ad do
        # Events
        get  "events",                  to: "events#index"
        get  "events/timeline",         to: "events#timeline"
        # Logon Activity
        get  "logons",                  to: "logons#index"
        get  "logons/failed",           to: "logons#failed"
        get  "logons/off_hours",        to: "logons#off_hours"
        get  "logons/risky_locations",  to: "logons#risky_locations"
        # GPO
        get  "gpo",                     to: "gpo#index"
        get  "gpo/:id/changes",         to: "gpo#changes"
        get  "gpo/risky",               to: "gpo#risky"
        # Users
        get  "users",                   to: "users#index"
        get  "users/risky",             to: "users#risky"
        get  "users/:id",               to: "users#show"
        # PingCastle
        post "pingcastle/upload",       to: "pingcastle#upload"
        get  "pingcastle/latest",       to: "pingcastle#latest"
        get  "pingcastle/compare",      to: "pingcastle#compare"
        get  "pingcastle/correlate",    to: "pingcastle#correlate"
        # KPIs & Predictions
        get  "kpis",                    to: "kpis#index"
        get  "predictions",             to: "predictions#index"
      end

      # === MODULE 2: ENTRA ID (Azure AD) ===
      namespace :entra do
        get  "events",                  to: "events#index"
        get  "sign_ins",                to: "sign_ins#index"
        get  "sign_ins/risky",          to: "sign_ins#risky"
        get  "sign_ins/mfa_failures",   to: "sign_ins#mfa_failures"
        get  "users",                   to: "users#index"
        get  "users/risky",             to: "users#risky"
        get  "users/:id",               to: "users#show"
        get  "conditional_access",      to: "conditional_access#index"
        get  "conditional_access/bypasses", to: "conditional_access#bypasses"
        get  "app_consents",            to: "app_consents#index"
        get  "kpis",                    to: "kpis#index"
        get  "predictions",             to: "predictions#index"
      end

      # === MODULE 3: FILE SERVER ===
      namespace :fileserver do
        get  "events",                  to: "events#index"
        get  "events/timeline",         to: "events#timeline"
        get  "shares",                  to: "shares#index"
        get  "shares/:id",              to: "shares#show"
        get  "sensitive_data",          to: "sensitive_data#index"
        get  "sensitive_data/heatmap",  to: "sensitive_data#heatmap"
        get  "sensitive_data/by_type",  to: "sensitive_data#by_type"
        get  "kpis",                    to: "kpis#index"
        get  "predictions",             to: "predictions#index"
      end

      # === MODULE 4: SHAREPOINT ONLINE ===
      namespace :sharepoint do
        get  "events",                  to: "events#index"
        get  "sites",                   to: "sites#index"
        get  "sites/:id/sensitive",     to: "sites#sensitive"
        get  "overshared",              to: "sharing#overshared"
        get  "external_sharing",        to: "sharing#external"
        get  "sensitive_data",          to: "sensitive_data#index"
        get  "kpis",                    to: "kpis#index"
        get  "predictions",             to: "predictions#index"
      end

      # === MODULE 5: EXCHANGE ONLINE ===
      namespace :exchange do
        get  "events",                  to: "events#index"
        get  "mailboxes",               to: "mailboxes#index"
        get  "mailboxes/risky",         to: "mailboxes#risky"
        get  "sensitive_emails",        to: "sensitive#index"
        get  "dlp_violations",          to: "dlp#index"
        get  "forwarding_rules",        to: "forwarding_rules#index"  # exfil risk
        get  "kpis",                    to: "kpis#index"
        get  "predictions",             to: "predictions#index"
      end

      # === MODULE 6: MICROSOFT TEAMS ===
      namespace :teams do
        get  "events",                  to: "events#index"
        get  "channels",                to: "channels#index"
        get  "external_access",         to: "external#index"
        get  "guest_activity",          to: "guests#index"
        get  "sensitive_messages",      to: "sensitive#index"  # NDC on Teams content
        get  "kpis",                    to: "kpis#index"
        get  "predictions",             to: "predictions#index"
      end

      # === AI ENGINE ===
      namespace :ai do
        post "predict_risk",            to: "predictions#risk"
        post "predict_breach",          to: "predictions#breach"
        post "analyze_user",            to: "predictions#analyze_user"
        post "query",                   to: "chat#query"
        get  "forecast/:module_name",   to: "forecast#show"    # 1M/2M/3M/1Y/2Y per module
        get  "recommendations/:module_name", to: "recommendations#index"
      end

      # === SETTINGS ===
      get  "settings",            to: "settings#show"
      put  "settings/na",         to: "settings#update_na"
      put  "settings/ndc",        to: "settings#update_ndc"
      put  "settings/ai",         to: "settings#update_ai"
      put  "settings/sync",       to: "settings#update_sync"
      post "settings/test_na",    to: "settings#test_na"
      post "settings/test_ndc",   to: "settings#test_ndc"
      post "settings/complete_setup", to: "settings#complete_setup"

      # === SYNC JOBS ===
      namespace :sync do
        post "discover",                to: "sync#discover"
        post "ad",                      to: "sync#ad"
        post "entra",                   to: "sync#entra"
        post "fileserver",              to: "sync#fileserver"
        post "sharepoint",              to: "sync#sharepoint"
        post "exchange",                to: "sync#exchange"
        post "teams",                   to: "sync#teams"
        post "pingcastle",              to: "sync#pingcastle"
        get  "status",                  to: "sync#status"
      end

    end
  end

  get "health",      to: proc { [200, {}, ["ok"]] }
  get "api/health",  to: proc { [200, {}, ["ok"]] }
end
