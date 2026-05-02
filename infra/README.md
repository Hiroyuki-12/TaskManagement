# infra/ — TaskManagement AWS デプロイ (Terraform)

スクール課題向け・個人利用前提で、**AWS 無料枠($0 運用)** で TaskManagement をデプロイするための Terraform 設定。

## フェーズ全体像

```
Phase 1: EC2 1台に Front+Back+DB 同居 (現在ここ)
   ↓
Phase 2: DB を RDS に切り出す
   ↓
Phase 3: フロントを S3 + CloudFront に切り出す
```

詳細は GitHub Issue #26 (全体計画) を参照。

## このディレクトリの中身

| ファイル | 役割 |
|---|---|
| `backend.tf` | tfstate を S3 + DynamoDB ロックで管理 (無料枠内) |
| `providers.tf` | AWS プロバイダ (`ap-northeast-1`) と共通タグ |
| `variables.tf` | 入力変数 (project / region / my_ip / key_name) |
| `terraform.tfvars.example` | `terraform.tfvars` の雛形。自分の IP を埋める |

> 後続ステップで `network.tf` `security.tf` `ec2.tf` `user_data.sh` などを追加していく。

## なぜ S3 + DynamoDB を使うのか (tfstate 用)

Terraform は「現在 AWS に何を作ったか」を `terraform.tfstate` というファイルで管理する。これを **S3 に保管 + DynamoDB でロック** することで以下を実現する:

- 状態ファイルの紛失防止 (S3 のバージョニング有効)
- 複数人 / 複数 PC からの同時更新による破損防止 (DynamoDB ロック)
- 実務で標準的に使われるパターンの学習

> S3 5GB / DynamoDB 25GB は **Always Free** 枠で課金されない。

## 前提

ローカルに以下が揃っていること:
- AWS CLI (`aws --version`)
- Terraform 1.6 以上 (`terraform -version`)
- `aws configure` で `ap-northeast-1` の IAM ユーザー認証情報を設定済み (`aws sts get-caller-identity` で確認)

## 初回セットアップ手順

### 1. tfstate 用の S3 バケットと DynamoDB テーブル

Step #1 で AWS CLI から既に作成済み。再構築が必要な場合のみ以下を実行:

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

### 2. EC2 用 SSH キーペアを作成 (ローカル + AWS)

**秘密鍵をログに残さないため、自分の手で 1 度だけ実行する。**

```bash
aws ec2 create-key-pair \
  --key-name taskmanagement-key \
  --region ap-northeast-1 \
  --query 'KeyMaterial' --output text > ~/.ssh/taskmanagement-key.pem
chmod 400 ~/.ssh/taskmanagement-key.pem
```

確認:
```bash
ls -l ~/.ssh/taskmanagement-key.pem
aws ec2 describe-key-pairs --key-names taskmanagement-key --region ap-northeast-1
```

### 3. terraform.tfvars を作る

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# 自分のグローバル IP を確認
curl -s https://checkip.amazonaws.com
# terraform.tfvars の my_ip を "<上記IP>/32" に書き換える
```

### 4. terraform init

```bash
cd infra
terraform init
```

成功すれば `Terraform has been successfully initialized!` が表示される。

## 後片付け (課題提出後・課金停止)

```bash
# 1. Terraform で作ったリソースを全削除
cd infra
terraform destroy

# 2. tfstate 用のリソースも消す (任意・ただし無料枠内)
aws s3 rm s3://taskmanagement-tfstate-okkun --recursive
aws s3api delete-bucket --bucket taskmanagement-tfstate-okkun --region ap-northeast-1
aws dynamodb delete-table --table-name taskmanagement-tflock --region ap-northeast-1

# 3. SSH キーペア
aws ec2 delete-key-pair --key-name taskmanagement-key --region ap-northeast-1
rm ~/.ssh/taskmanagement-key.pem
```

## 注意事項

- `terraform.tfvars` / `.terraform/` / `*.tfstate*` / `*.pem` は **絶対に Git にコミットしない** (`.gitignore` で除外済み)
- 12ヶ月の無料枠を超えると EC2 / EBS が課金対象。**使わなくなったら必ず `terraform destroy`**
- DB パスワードや自宅 IP などの秘密値は `terraform.tfvars` に置く
