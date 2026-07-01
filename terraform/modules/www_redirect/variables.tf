variable "domain_name" {
  description = "Canonical site domain."
  type        = string
}

variable "www_domain_name" {
  description = "www domain that redirects to domain_name."
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID."
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1."
  type        = string
}

variable "cloudfront_price_class" {
  description = "CloudFront price class."
  type        = string
}
