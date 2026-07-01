variable "aws_region" {
  description = "AWS region for regional resources."
  type        = string
  default     = "ap-northeast-1"
}

variable "domain_name" {
  description = "Canonical site domain."
  type        = string
  default     = "itxryx.com"
}

variable "www_domain_name" {
  description = "www domain that redirects to the canonical domain."
  type        = string
  default     = "www.itxryx.com"
}

variable "hosted_zone_id" {
  description = "Existing Route53 hosted zone ID for the site domain."
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 covering both domain_name and www_domain_name."
  type        = string
}

variable "site_bucket_name" {
  description = "Globally unique S3 bucket name for the static site files."
  type        = string
}

variable "cloudfront_price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_200"
}

