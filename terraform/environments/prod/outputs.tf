output "site_bucket_name" {
  description = "S3 bucket to sync the static export into."
  value       = module.static_site.bucket_id
}

output "site_distribution_id" {
  description = "CloudFront distribution ID for itxryx.com."
  value       = module.static_site.distribution_id
}

output "site_url" {
  description = "Canonical site URL."
  value       = "https://${var.domain_name}"
}
