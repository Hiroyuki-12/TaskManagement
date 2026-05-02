terraform {
  required_version = ">= 1.6.0"

  backend "s3" {
    bucket         = "taskmanagement-tfstate-okkun"
    key            = "phase1/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "taskmanagement-tflock"
    encrypt        = true
  }
}
