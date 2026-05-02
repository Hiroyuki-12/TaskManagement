#!/bin/bash
set -euxo pipefail
# Amazon Linux 2023 初期セットアップ:
#  - Docker / Docker Compose plugin / git インストール
#  - TaskManagement を clone
#  - GitHub Releases から事前ビルド済み JAR を取得して backend/app.jar に配置
#  - compose.prod.yaml で backend + db 起動

# 1. パッケージ更新と必要ツール
dnf -y update
dnf -y install docker git

# 2. Docker 起動 + ec2-user で sudo なしに使えるように
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

# 5. GitHub Releases から事前ビルド済み JAR を取得
#    タグ "latest" を release alias として運用 (gh release create / upload --clobber で更新)
JAR_URL="https://github.com/Hiroyuki-12/TaskManagement/releases/latest/download/app.jar"
curl -sSL --retry 5 --retry-delay 5 -L "$JAR_URL" -o "$APP_DIR/backend/app.jar"
test -s "$APP_DIR/backend/app.jar" # 0 byte なら release 未作成

chown -R ec2-user:ec2-user "$APP_DIR"

# 6. compose 起動 (jre + jar の COPY だけなので軽量・数秒で完了)
cd "$APP_DIR"
docker compose -f compose.prod.yaml up -d --build
