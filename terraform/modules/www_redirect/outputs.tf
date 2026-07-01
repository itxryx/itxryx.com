output "distribution_id" {
  description = "CloudFront distribution ID for www redirects."
  value       = aws_cloudfront_distribution.www_redirect.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN for www redirects."
  value       = aws_cloudfront_distribution.www_redirect.arn
}

