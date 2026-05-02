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

output "ec2_public_dns" {
  description = "EC2 のパブリック DNS"
  value       = aws_instance.app.public_dns
}

output "ec2_public_ip" {
  description = "EC2 のパブリック IP"
  value       = aws_instance.app.public_ip
}

output "ssh_command" {
  description = "EC2 へ SSH するためのコマンド"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_instance.app.public_dns}"
}

output "api_url" {
  description = "アプリ URL (Nginx 経由)"
  value       = "http://${aws_instance.app.public_dns}/"
}

output "rds_endpoint" {
  description = "RDS のエンドポイント (VPC 内のみ到達可)"
  value       = aws_db_instance.main.endpoint
}
