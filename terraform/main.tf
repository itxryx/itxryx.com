# =============================================================================
# S3 Bucket
# =============================================================================

resource "aws_s3_bucket" "website" {
  bucket = var.project_name
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# =============================================================================
# CloudFront Origin Access Control (OAC)
# =============================================================================

resource "aws_cloudfront_origin_access_control" "website" {
  name                              = "${var.project_name}-oac"
  description                       = "OAC for ${var.domain_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# =============================================================================
# CloudFront Function (www -> non-www redirect)
# =============================================================================

resource "aws_cloudfront_function" "redirect_www" {
  name    = "${var.project_name}-redirect-www"
  runtime = "cloudfront-js-2.0"
  comment = "Redirect www.${var.domain_name} to ${var.domain_name}"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      var host = request.headers.host.value;

      if (host === 'www.${var.domain_name}') {
        return {
          statusCode: 301,
          statusDescription: 'Moved Permanently',
          headers: {
            location: { value: 'https://${var.domain_name}' + request.uri }
          }
        };
      }

      return request;
    }
  EOT
}

# =============================================================================
# CloudFront Distribution
# =============================================================================

resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_200"
  aliases             = [var.domain_name, "www.${var.domain_name}"]

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id                = "S3-${var.project_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.project_name}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # AWS Managed Cache Policy: CachingOptimized
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    # AWS Managed Origin Request Policy: CORS-S3Origin
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.redirect_www.arn
    }
  }

  # SPA対応: 403/404エラー時にindex.htmlを返す
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# =============================================================================
# S3 Bucket Policy
# =============================================================================

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.website.arn
          }
        }
      }
    ]
  })
}
