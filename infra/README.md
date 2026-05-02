# infra/ — TaskManagement AWS デプロイ (Terraform)

スクール課題向けの個人利用前提・**AWS 無料枠** で TaskManagement をデプロイするための Terraform 設定。

## 構成 (Phase 2: RDS 切り出し済)

```
ユーザー ──HTTP/80──▶ ┌─────────────────────────────────┐
                    │ EC2 t2.micro (Public Subnet, AZ-a)│
                    │  ├─ Nginx (80)                    │
                    │  │   ├─ /        → React 静的     │
                    │  │   └─ /api/*  → :8080           │
                    │  └─ Spring Boot (8080) Docker     │
                    │  EBS gp3 8GB                      │
                    └────────────┬─────────────────────┘
                                 │ private DNS (5432)
                                 ▼
                    ┌─────────────────────────────────┐
                    │ RDS db.t3.micro                 │
                    │ PostgreSQL 16 / 20GB gp3        │
                    │ (Private Subnets AZ-a, AZ-c)    │
                    └─────────────────────────────────┘
```

| AWS リソース | 用途 | 課金 |
|---|---|---|
| VPC / Subnet / IGW / Route Table | ネットワーク | 無料 |
| Security Group | 22 / 80 を `my_ip` のみ許可 | 無料 |
| EC2 t2.micro | アプリ実行 | 750h/月 (12ヶ月) |
| EBS gp3 8GB | EC2 ルートディスク | 30GB/月 (12ヶ月) |
| RDS db.t3.micro | マネージド PostgreSQL | 750h/月 (12ヶ月) |
| RDS gp3 20GB | DB ストレージ | 20GB (12ヶ月) |
| S3 (tfstate) | Terraform 状態管理 | 5GB (12ヶ月) |
| DynamoDB (tflock) | tfstate ロック | 25GB (Always Free) |
| データ転送 out | EC2 → ネット | 100GB/月 (Always Free) |

NAT Gateway / ALB / RDS / Route53 / Elastic IP は使わない (有料のため)。

## ディレクトリ

| ファイル | 役割 |
|---|---|
| `backend.tf` | tfstate を S3 + DynamoDB |
| `providers.tf` | AWS provider, 共通タグ |
| `variables.tf` | project / region / my_ip / key_name |
| `network.tf` | VPC / IGW / public subnet / route table |
| `security.tf` | EC2 用 SG (22 / 80 from my_ip) |
| `ec2.tf` | EC2 t2.micro + EBS + AMI lookup |
| `user_data.sh` | cloud-init: Docker / git / nginx 導入、release から JAR と dist 取得、起動 |
| `nginx.conf` | / 静的配信 + /api/ → :8080 リバプロ |
| `outputs.tf` | DNS / IP / SSH コマンド等を表示 |
| `terraform.tfvars.example` | tfvars 雛形 (実体は Git 除外) |

## 前提

- AWS CLI (`aws sts get-caller-identity` で認証確認)
- Terraform 1.6+
- Docker Desktop (ローカル動作確認用)
- Java 25 + Gradle (ローカルで JAR ビルド)
- Node.js (ローカルで frontend ビルド)
- GitHub CLI (`gh release` 用)

## 初回セットアップ手順

### 1. tfstate 用 S3 / DynamoDB を作成 (1 回だけ)

```bash
aws s3api create-bucket \
  --bucket taskmanagement-tfstate-okkun \
  --region ap-northeast-1 \
  --create-bucket-configuration LocationConstraint=ap-northeast-1
aws s3api put-bucket-versioning --bucket taskmanagement-tfstate-okkun \
  --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket taskmanagement-tfstate-okkun \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket taskmanagement-tfstate-okkun \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws dynamodb create-table --table-name taskmanagement-tflock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region ap-northeast-1
```

### 2. EC2 用 SSH キーペアを作成

**チャットログに鍵を残さないため、自分の手元で実行する。**

```bash
aws ec2 create-key-pair \
  --key-name taskmanagement-key \
  --region ap-northeast-1 \
  --query 'KeyMaterial' --output text > ~/.ssh/taskmanagement-key.pem
chmod 400 ~/.ssh/taskmanagement-key.pem
```

### 3. terraform.tfvars を作る (Git 除外)

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
curl -s https://checkip.amazonaws.com    # 自分の IP を確認
# my_ip を "<上記IP>/32" に書き換え
# db_password を強いランダム文字列に書き換え (生成例: openssl rand -base64 24 | tr -d '/+=')
```

### 4. terraform init

```bash
cd infra && terraform init
```

### 5. 初回デプロイ

リポジトリルートで:

```bash
make release    # JAR + frontend dist をビルドして GitHub Releases (タグ "latest") に upload
make deploy     # terraform apply で EC2 起動 (user_data が release から取得して起動)
```

数分待つと、`terraform output -raw ec2_public_dns` で表示される URL でアプリが開く。

## 日常運用

| やりたいこと | コマンド |
|---|---|
| コード更新後に再デプロイ | `make release && make redeploy` |
| EC2 へ SSH | `make ssh` |
| コンテナ状態を見る | `make status` |
| ログを追う | `make logs` |
| 全部消す | `make destroy` |

## トラブルシュート

- **502 Bad Gateway**: backend がまだ起動中。Nginx が先に立ち上がるため初回は 1〜2 分待つ
- **接続できない (timeout)**: 自宅 IP が変わった可能性。`curl https://checkip.amazonaws.com` → `terraform.tfvars` の `my_ip` を更新 → `terraform apply`
- **user_data が失敗**: `make ssh` 後 `sudo cat /var/log/cloud-init-output.log`
- **release URL が 404**: `make release` を先に実行する必要あり

## 後片付け (課題提出後)

```bash
# 1. EC2 / VPC / SG 削除
make destroy

# 2. tfstate 用リソース削除 (任意・無料枠内)
aws s3 rm s3://taskmanagement-tfstate-okkun --recursive
aws s3api delete-bucket --bucket taskmanagement-tfstate-okkun --region ap-northeast-1
aws dynamodb delete-table --table-name taskmanagement-tflock --region ap-northeast-1

# 3. SSH キーペア
aws ec2 delete-key-pair --key-name taskmanagement-key --region ap-northeast-1
rm ~/.ssh/taskmanagement-key.pem
```

## セキュリティ運用

- `terraform.tfvars` / `*.tfstate*` / `*.pem` / `tfplan` / `app.jar` / `frontend-dist.tar.gz` は **Git 管理しない** (`.gitignore` 済み)
- SSH 22 / HTTP 80 は **`my_ip/32` のみ許可**。第三者に見せたい時だけ `cidr_blocks = ["0.0.0.0/0"]` に一時変更
- 12ヶ月の無料枠を超えると EC2 / EBS が課金対象。**使わなくなったら必ず `make destroy`**

## 将来の拡張 (Phase 3)

- GitHub Actions による自動デプロイ
- Route53 + ACM で独自ドメイン HTTPS
- CloudWatch Logs 集約

> フロントは EC2 上の Nginx 配信で固定。S3 + CloudFront 構成は採用しない。

## 12ヶ月後の課金注意

RDS / EC2 / EBS の無料枠は **12 ヶ月限定**。期限が近づいたら必ず `make destroy` で停止すること。
RDS を残したまま放置すると月 \$15 程度発生する。
