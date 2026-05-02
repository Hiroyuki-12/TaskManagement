#!/bin/bash
set -euxo pipefail
# Amazon Linux 2023 初期セットアップ:
#  - Docker / Docker Compose plugin / git / nginx / postgresql client インストール
#  - GitHub Releases から事前ビルド済み JAR / frontend-dist.tar.gz を取得
#  - RDS 接続情報を /opt/taskmanagement/.env として書き出し
#  - compose.prod.yaml で backend のみ起動 (DB は RDS)
#  - nginx で / 静的配信 + /api/ をバックエンドにリバプロ

# 1. パッケージ
dnf -y update
dnf -y install docker git nginx tar postgresql16

# 2. Docker
systemctl enable --now docker
usermod -aG docker ec2-user

# 3. Docker Compose plugin
DOCKER_CONFIG_DIR=/usr/libexec/docker/cli-plugins
mkdir -p "$DOCKER_CONFIG_DIR"
COMPOSE_VERSION="v2.29.7"
ARCH="$(uname -m)"
curl -sSL "https://github.com/docker/compose/releases/download/$${COMPOSE_VERSION}/docker-compose-linux-$${ARCH}" \
  -o "$DOCKER_CONFIG_DIR/docker-compose"
chmod +x "$DOCKER_CONFIG_DIR/docker-compose"

# 4. リポジトリ取得
APP_DIR=/opt/taskmanagement
git clone https://github.com/Hiroyuki-12/TaskManagement.git "$APP_DIR"

# 5. GitHub Releases から成果物を取得
RELEASE_BASE="https://github.com/Hiroyuki-12/TaskManagement/releases/latest/download"

curl -sSL --retry 5 --retry-delay 5 -L "$${RELEASE_BASE}/app.jar" -o "$APP_DIR/backend/app.jar"
test -s "$APP_DIR/backend/app.jar"

curl -sSL --retry 5 --retry-delay 5 -L "$${RELEASE_BASE}/frontend-dist.tar.gz" -o /tmp/frontend-dist.tar.gz
test -s /tmp/frontend-dist.tar.gz
rm -rf /var/www/html
mkdir -p /var/www/html
tar -xzf /tmp/frontend-dist.tar.gz -C /var/www/html --strip-components=1
chown -R nginx:nginx /var/www/html

# 6. RDS 接続情報を .env として書き出し (Terraform から渡される)
cat > "$APP_DIR/.env" <<EOF
SPRING_DATASOURCE_URL=jdbc:postgresql://${db_host}:${db_port}/${db_name}
SPRING_DATASOURCE_USERNAME=${db_username}
SPRING_DATASOURCE_PASSWORD=${db_password}
EOF
chmod 600 "$APP_DIR/.env"

chown -R ec2-user:ec2-user "$APP_DIR"

# 7. nginx 設定
rm -f /etc/nginx/conf.d/default.conf
cp "$APP_DIR/infra/nginx.conf" /etc/nginx/conf.d/taskmanagement.conf
nginx -t

# 8. backend 起動 (RDS に Flyway で自動マイグレーション)
cd "$APP_DIR"
docker compose --env-file .env -f compose.prod.yaml up -d --build

# 9. nginx 起動
systemctl enable --now nginx
