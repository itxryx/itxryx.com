resource "aws_cloudfront_function" "redirect_to_apex" {
  name    = "${replace(var.www_domain_name, ".", "-")}-redirect-to-apex"
  runtime = "cloudfront-js-2.0"
  comment = "Redirect ${var.www_domain_name} to ${var.domain_name}"
  publish = true
  code    = <<-EOT
function handler(event) {
  var request = event.request;
  var location = "https://${var.domain_name}" + request.uri;

  if (request.querystring && Object.keys(request.querystring).length > 0) {
    var query = [];
    for (var key in request.querystring) {
      var value = request.querystring[key].value;
      query.push(value === "" ? key : key + "=" + value);
    }
    location += "?" + query.join("&");
  }

  return {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: {
      location: { value: location },
      "cache-control": { value: "public, max-age=3600" }
    }
  };
}
EOT
}

resource "aws_cloudfront_distribution" "www_redirect" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.www_domain_name} redirect"
  aliases         = [var.www_domain_name]
  price_class     = var.cloudfront_price_class

  origin {
    domain_name              = var.origin_domain_name
    origin_id                = var.origin_id
    origin_access_control_id = var.origin_access_control_id
  }

  default_cache_behavior {
    target_origin_id       = var.origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.redirect_to_apex.arn
    }

    forwarded_values {
      query_string = true

      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }
}

resource "aws_route53_record" "www_a" {
  zone_id = var.hosted_zone_id
  name    = var.www_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.www_redirect.domain_name
    zone_id                = aws_cloudfront_distribution.www_redirect.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_aaaa" {
  zone_id = var.hosted_zone_id
  name    = var.www_domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.www_redirect.domain_name
    zone_id                = aws_cloudfront_distribution.www_redirect.hosted_zone_id
    evaluate_target_health = false
  }
}
