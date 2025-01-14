resource "google_service_account" "terraform-service-account" {
  project      = local.project_id
  account_id   = "terraform-service-account"
  display_name = "terraform_service_account"
}

resource "google_project_iam_member" "admin" {
  project = local.project_id
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.terraform-service-account.email}"
}
