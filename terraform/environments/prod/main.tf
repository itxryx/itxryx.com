module "static_site" {
  source = "../../modules/static_site"

  bucket_name            = var.site_bucket_name
  domain_name            = var.domain_name
  hosted_zone_id         = var.hosted_zone_id
  acm_certificate_arn    = var.acm_certificate_arn
  cloudfront_price_class = var.cloudfront_price_class
}

module "www_redirect" {
  source = "../../modules/www_redirect"

  domain_name            = var.domain_name
  www_domain_name        = var.www_domain_name
  hosted_zone_id         = var.hosted_zone_id
  acm_certificate_arn    = var.acm_certificate_arn
  cloudfront_price_class = var.cloudfront_price_class
}

data "aws_iam_policy_document" "site_bucket" {
  statement {
    sid = "AllowCloudFrontRead"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = ["s3:GetObject"]

    resources = [
      "${module.static_site.bucket_arn}/*",
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values = [
        module.static_site.distribution_arn,
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = module.static_site.bucket_id
  policy = data.aws_iam_policy_document.site_bucket.json
}
