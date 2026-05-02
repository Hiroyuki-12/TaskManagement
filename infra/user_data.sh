#!/bin/bash
set -euxo pipefail
# Amazon Linux 2023 初期セットアップ:
#  - Docker / Docker Compose plugin / git / nginx インストール
#  - TaskManagement を clone
#  - GitHub Releases から事前ビルド済み JAR / frontend-dist.tar.gz を取得
#  - compose.prod.yaml で backend + db 起動
#  - nginx で / 静的配信 + /api/ をバックエンドにリバプロ

# 1. パッケージ更新と必要ツール
dnf -y update
dnf -y install docker git nginx tar

# 2. Docker 起動
systemctl enable --now docker
usermod -aG docker ec2-user

# 3. Docker Compose plugin
DOCKER_CONFIG_DIR=/usr/libexec/docker/cli-plugins
mkdir -p "$DOCKER_CONFIG_DIR"
COMPOSE_VERSION="v2.29.7"
ARCH="$(uname -m)"
curl -sSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${ARCH}" \
  -o "$DOCKER_CONFIG_DIR/docker-compose"
chmod +x "$DOCKER_CONFIG_DIR/docker-compose"

# 4. リポジトリ取得
APP_DIR=/opt/taskmanagement
git clone https://github.com/Hiroyuki-12/TaskManagement.git "$APP_DIR"

# 5. GitHub Releases から成果物を取得
RELEASE_BASE="https://github.com/Hiroyuki-12/TaskManagement/releases/latest/download"

#   5-1. backend JAR
curl -sSL --retry 5 --retry-delay 5 -L "${RELEASE_BASE}/app.jar" -o "$APP_DIR/backend/app.jar"
test -s "$APP_DIR/backend/app.jar"

#   5-2. frontend tarball
curl -sSL --retry 5 --retry-delay 5 -L "${RELEASE_BASE}/frontend-dist.tar.gz" -o /tmp/frontend-dist.tar.gz
test -s /tmp/frontend-dist.tar.gz
rm -rf /var/www/html
mkdir -p /var/www/html
tar -xzf /tmp/frontend-dist.tar.gz -C /var/www/html --strip-components=1
chown -R nginx:nginx /var/www/html

chown -R ec2-user:ec2-user "$APP_DIR"

# 6. nginx 設定 (リポジトリの infra/nginx.conf を使用)
#    AL2023 のデフォルト server (default.conf) を無効化し、taskmanagement.conf を配置
rm -f /etc/nginx/conf.d/default.conf
cp "$APP_DIR/infra/nginx.conf" /etc/nginx/conf.d/taskmanagement.conf
nginx -t

# 7. バックエンド起動
cd "$APP_DIR"
docker compose -f compose.prod.yaml up -d --build

# 8. nginx 起動
systemctl enable --now nginx
