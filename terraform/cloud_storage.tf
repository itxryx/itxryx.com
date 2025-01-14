resource "google_storage_bucket" "default" {
  name          = "${local.prefix}-tfstate"
  location      = local.region
  force_destroy = false

  uniform_bucket_level_access = true

  labels = {
    name = "itxryx-com"
  }
}
