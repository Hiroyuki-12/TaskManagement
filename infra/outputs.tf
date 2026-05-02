output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "Public subnet ID (EC2 配置先)"
  value       = aws_subnet.public.id
}

output "ec2_security_group_id" {
  description = "EC2 用セキュリティグループ ID"
  value       = aws_security_group.ec2.id
}

output "availability_zone" {
  description = "使用中の AZ"
  value       = aws_subnet.public.availability_zone
}
