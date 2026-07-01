output "bucket_id" {
  description = "Static site bucket ID."
  value       = aws_s3_bucket.site.id
}

output "bucket_arn" {
  description = "Static site bucket ARN."
  value       = aws_s3_bucket.site.arn
}

output "distribution_id" {
  description = "CloudFront distribution ID."
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.site.arn
}
