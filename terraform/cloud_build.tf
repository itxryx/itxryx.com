resource "google_cloudbuild_trigger" "default" {
  project  = local.project_id
  location = "global"
  name     = "${local.prefix}-trigger"
  filename = "cloudbuild.yaml"

  github {
    owner = local.github_owner
    name  = local.github_repo

    push {
      branch = "^${var.target_branch}$"
    }
  }

  service_account = google_service_account.terraform-service-account.id

  substitutions = {
    "_ENVIRONMENT" = "production"
    "_SERVICE_NAME" = "itxryx-com"
    "_GA_TRACKING_ID" = var.ga_tracking_id
  }
}
