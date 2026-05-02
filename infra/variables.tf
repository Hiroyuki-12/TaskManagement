variable "project" {
  description = "プロジェクト識別子。リソース名・タグの prefix に使う"
  type        = string
  default     = "taskmanagement"
}

variable "region" {
  description = "デプロイ先 AWS リージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "リソースの Environment タグ (dev / prod など)"
  type        = string
  default     = "prod"
}

variable "my_ip" {
  description = "SSH 接続を許可する自宅 IP (CIDR 形式 例: 203.0.113.10/32)。terraform.tfvars で設定し Git にコミットしないこと"
  type        = string
}

variable "key_name" {
  description = "EC2 にアタッチする SSH キーペア名 (事前に AWS CLI で作成済みのもの)"
  type        = string
  default     = "taskmanagement-key"
}

variable "db_name" {
  description = "RDS の DB 名"
  type        = string
  default     = "taskmanagement"
}

variable "db_username" {
  description = "RDS の master ユーザー"
  type        = string
  default     = "task_user"
}

variable "db_password" {
  description = "RDS の master パスワード (terraform.tfvars で指定、Git 管理外)"
  type        = string
  sensitive   = true
}
