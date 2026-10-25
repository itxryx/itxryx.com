locals {
  existing_bucket = var.import_existing ? toset([var.state_bucket_name]) : toset([])
  existing_table  = var.import_existing ? toset([var.lock_table_name]) : toset([])
}

import {
  for_each = local.existing_bucket
  to       = aws_s3_bucket.terraform_state
  id       = each.value
}

import {
  for_each = local.existing_bucket
  to       = aws_s3_bucket_public_access_block.terraform_state
  id       = each.value
}

import {
  for_each = local.existing_bucket
  to       = aws_s3_bucket_ownership_controls.terraform_state
  id       = each.value
}

import {
  for_each = local.existing_bucket
  to       = aws_s3_bucket_versioning.terraform_state
  id       = each.value
}

import {
  for_each = local.existing_bucket
  to       = aws_s3_bucket_server_side_encryption_configuration.terraform_state
  id       = each.value
}

import {
  for_each = local.existing_table
  to       = aws_dynamodb_table.terraform_locks
  id       = each.value
}
