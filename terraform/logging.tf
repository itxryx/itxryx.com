resource "google_bigquery_dataset" "default" {
  dataset_id = "${replace(tostring(local.project_id), "-", "_")}_logs"
  location   = local.region

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_logging_project_sink" "default" {
  name                   = "${local.project_id}_logs"
  destination            = "bigquery.googleapis.com/projects/${local.project_id}/datasets/${google_bigquery_dataset.default.dataset_id}"
  filter                 = "resource.type=\"cloud_run_revision\""
  unique_writer_identity = true
}

resource "google_project_iam_binding" "bigquery" {
  project = local.project_id
  role    = "roles/bigquery.dataEditor"

  members = [
    google_logging_project_sink.default.writer_identity,
  ]
}
