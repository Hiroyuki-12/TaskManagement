resource "aws_security_group" "ec2" {
  name        = "${var.project}-ec2"
  description = "TaskManagement EC2: SSH and HTTP from my_ip only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from my_ip"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  ingress {
    description = "HTTP from my_ip"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  # 一時: Step #4 で API 動作確認用に開放。Step #5 で Nginx を入れたら削除する
  ingress {
    description = "Spring Boot API from my_ip (temporary, until Step #5)"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-ec2-sg"
  }
}
