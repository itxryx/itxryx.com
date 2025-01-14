resource "google_artifact_registry_repository" "default" {
  location      = local.region
  repository_id = "itxryx-com"
  format        = "DOCKER"

  labels = {
    name = "itxryx-com"
  }
}
