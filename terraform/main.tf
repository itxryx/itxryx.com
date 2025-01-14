terraform {
  backend "gcs" {
    bucket  = "itxryx-com-tfstate"
  }
  required_providers {
    google = {
      source = "hashicorp/google"
    }
  }
}

provider "google" {
  project = local.project_id
  region  = local.region
  zone = "${local.region}-a"
}
