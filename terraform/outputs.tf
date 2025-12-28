output "s3_bucket_name" {
  description = "S3 bucket name for deployment"
  value       = aws_s3_bucket.website.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = aws_cloudfront_distribution.website.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name (*.cloudfront.net)"
  value       = aws_cloudfront_distribution.website.domain_name
}
