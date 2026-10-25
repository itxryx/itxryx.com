variable "aws_region" {
  description = "AWS region for Terraform state resources."
  type        = string
  default     = "ap-northeast-1"
}

variable "state_bucket_name" {
  description = "Globally unique S3 bucket name for Terraform state."
  type        = string
}

variable "lock_table_name" {
  description = "DynamoDB table name for Terraform state locking."
  type        = string
}

variable "import_existing" {
  description = "Import existing backend resources when their original state is unavailable."
  type        = bool
  default     = false
}

