# AWS インフラ構成

TaskManagement を AWS にデプロイするためのインフラ構成と設計判断を記録する。
個人利用・スクール課題向けに **AWS 無料枠 ($0 運用)** を前提とした最小構成。

実際の Terraform コードは `infra/` 配下、操作手順は [`infra/README.md`](../infra/README.md) を参照。

## 全体構成図

```
                                 [GitHub]
                                    │
                                    │ git clone / Releases (app.jar, frontend-dist.tar.gz)
                                    ▼
                                 [EC2 user_data]

ユーザー ──HTTP/80──▶ ┌──────────────────────────────────────┐
                    │ EC2 t2.micro (Public Subnet, AZ-a)    │
                    │  ├─ Nginx (80)                        │
                    │  │   ├─ /        → /var/www/html      │ React SPA
                    │  │   └─ /api/*  → 127.0.0.1:8080      │
                    │  └─ Spring Boot (8080) Docker         │ Java 25 + Boot 4
                    │  EBS gp3 8GB (encrypted)              │
                    └──────────────┬────────────────────────┘
                                   │ VPC 内 Private DNS / 5432
                                   ▼
                    ┌──────────────────────────────────────┐
                    │ RDS db.t3.micro (Private Subnets)    │
                    │ PostgreSQL 16 / 20GB gp3 / Single-AZ │
                    │ Subnet Group: AZ-a + AZ-c            │
                    └──────────────────────────────────────┘
```

## ネットワーク設計

VPC `10.0.0.0/16` 内に 1 つのパブリックサブネット (EC2 用) と、AZ をまたいだ 2 つのプライベートサブネット (RDS 用) を配置する。

| サブネット | AZ | 用途 |
|---|---|---|
| Public | ap-northeast-1a | EC2 (Nginx + Spring Boot) |
| Private A | ap-northeast-1a | RDS (主) |
| Private C | ap-northeast-1c | RDS Subnet Group の冗長 AZ 要件を満たすためのみ |

- Internet Gateway は Public サブネットからのみ到達可能 (default route)
- Private サブネットには NAT Gateway を**置かない**(時間課金で無料枠外のため)
- AZ は Terraform の `data "aws_availability_zones"` から動的取得

### セキュリティグループ

| SG | Ingress | Egress |
|---|---|---|
| EC2 SG | 22 / 80 を `var.my_ip/32` のみ | 全開放 (パッケージ取得・GitHub Releases 取得・RDS 接続のため) |
| DB SG | 5432 を **EC2 SG からのみ** | 全開放 |

8080 (Spring Boot) は SG で塞いでおり、Nginx 経由でしかバックエンドに到達できない。

## 採用リソース一覧

| AWS サービス | 用途 | 無料枠 |
|---|---|---|
| VPC / Subnet / IGW / Route Table | ネットワーク | 無料 |
| Security Group | アクセス制御 | 無料 |
| EC2 t2.micro | アプリ実行サーバー | 750h/月 (12ヶ月) |
| EBS gp3 8GB (暗号化) | EC2 ルートディスク | 30GB/月 (12ヶ月) |
| RDS db.t3.micro / PostgreSQL 16 | マネージド DB | 750h/月 (12ヶ月) |
| RDS gp3 20GB (暗号化) + バックアップ | DB ストレージ | 各 20GB (12ヶ月) |
| S3 (tfstate) | Terraform 状態管理 | 5GB (12ヶ月) |
| DynamoDB (tflock) | tfstate ロック | 25GB (Always Free) |
| データ転送 out | EC2 → ネット | 100GB/月 (Always Free) |

### 採用していないもの (有料 / 無料枠外のため)

- **NAT Gateway** (約 \$30/月) → プライベートサブネットからの outbound は無いので不要
- **ALB / NLB** (約 \$16/月) → Nginx で代替
- **Elastic IP** (関連付け中は無料、未使用時に課金) → DNS でアクセスする運用
- **Route 53 / ACM (独自ドメイン)** → AWS 提供の `*.amazonaws.com` 名で済ます
- **CloudFront / S3 静的配信** → フロントは EC2 上の Nginx で配信
- **Multi-AZ RDS** (有料) → Single-AZ で十分

## デプロイフロー

```
[ローカル Mac]
  ./gradlew bootJar  ─▶ backend/app.jar
  npm run build      ─▶ frontend/dist/  ─▶ frontend-dist.tar.gz
                              │
                              │ make release (gh release upload --clobber)
                              ▼
                       [GitHub Releases (tag: latest)]
                              │
                              │ make deploy / make redeploy
                              │ → terraform apply
                              ▼
                       [EC2 user_data]
                         curl で JAR / dist を取得 → 配置 → docker compose up
                                                  → /etc/nginx/conf.d/ 配置 → systemctl start
```

ポイント:
- t2.micro (1GB RAM) で Gradle / npm を回さない (OOM するため)
- 重い処理はローカル Mac で行い、EC2 は **完成品を実行するだけ**
- 成果物の配信に GitHub Releases を使うことで AWS 側の追加コストゼロ

## tfstate 管理

- **S3 backend** (`taskmanagement-tfstate-okkun`) に保管 (バージョニング・暗号化・パブリックアクセスブロック有効)
- **DynamoDB** (`taskmanagement-tflock`) で同時編集ロック
- backend を構成するための S3/DynamoDB は鶏卵問題回避のため **AWS CLI で初回手動作成** (Terraform 管理外)

## 機密値の扱い

| 値 | 保管場所 | コミット |
|---|---|---|
| AWS アクセスキー | `~/.aws/credentials` | しない |
| EC2 SSH 秘密鍵 | `~/.ssh/taskmanagement-key.pem` (chmod 400) | しない (`*.pem` を gitignore) |
| 自宅 IP (`my_ip`) | `infra/terraform.tfvars` | しない (`*.tfvars` を gitignore) |
| RDS パスワード (`db_password`) | `infra/terraform.tfvars` | しない |
| Terraform state | S3 (暗号化) | しない (`*.tfstate*` を gitignore) |

`.tf` ファイル中では値を直接書かず、すべて `var.*` 経由で参照する。

## 設計判断のメモ

| トピック | 判断 | 理由 |
|---|---|---|
| DB の場所 | RDS 切り出し | スクール講座の構成に合わせる + マネージド運用学習 |
| フロント配信 | EC2 上の Nginx | 構成シンプル、CloudFront/S3 不要、無料枠維持 |
| ビルド環境 | ローカル Mac で固定 | t2.micro では重すぎる |
| 成果物配布 | GitHub Releases | Public リポジトリなら無料・無制限 |
| HTTPS | 未対応 (Phase 3) | 個人利用・my_ip 限定で運用するため優先度低 |
| IAM Role | EC2 に未付与 | Phase 1 では不要、後で SSM Session Manager 化を検討 |

## 12ヶ月後の課金注意

EC2 / RDS / EBS の無料枠は **いずれも 12ヶ月限定**。期限後の概算:
- EC2 t2.micro: 約 \$8/月
- RDS db.t3.micro: 約 \$15/月
- EBS gp3 + RDS ストレージ: 数 \$/月

**課題提出後は速やかに `make destroy`** で全リソースを削除すること。
