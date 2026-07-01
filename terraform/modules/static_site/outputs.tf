output "bucket_id" {
  description = "Static site bucket ID."
  value       = aws_s3_bucket.site.id
}

output "bucket_arn" {
  description = "Static site bucket ARN."
  value       = aws_s3_bucket.site.arn
}

output "bucket_regional_domain_name" {
  description = "Regional S3 bucket domain name."
  value       = aws_s3_bucket.site.bucket_regional_domain_name
}

output "origin_access_control_id" {
  description = "CloudFront origin access control ID."
  value       = aws_cloudfront_origin_access_control.site.id
}

output "origin_id" {
  description = "CloudFront origin ID for the S3 bucket."
  value       = local.origin_id
}

output "distribution_id" {
  description = "CloudFront distribution ID."
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.site.arn
}

