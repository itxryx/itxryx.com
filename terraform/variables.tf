variable "aws_region" {
  description = "AWS region for main resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "itxryx-com"
}

variable "domain_name" {
  description = "Domain name for the website"
  type        = string
  default     = "itxryx.com"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for CloudFront (must be in us-east-1)"
  type        = string
}
