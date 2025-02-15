locals {
  project_id      = "itxryx-com"
  region          = "asia-northeast1"
  zone            = "${local.region}-a"

  github_owner    = "itxryx"
  github_repo     = "itxryx.com"
  prefix          = "itxryx-com"
}

variable "target_branch" {
  type = string
  default = "main"
}

variable "ga_tracking_id" {
  type = string
  default = "G-H0EW7RJZYE"
}
