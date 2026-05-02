#!/bin/bash
set -euxo pipefail
# Amazon Linux 2023 初期セットアップ:
#  - Docker / Docker Compose plugin / git インストール
#  - TaskManagement を clone
#  - compose.prod.yaml で backend + db 起動

# 1. パッケージ更新と必要ツール
dnf -y update
dnf -y install docker git

# 2. Docker 起動 + ec2-user で sudo なしに使えるように
systemctl enable --now docker
usermod -aG docker ec2-user

# 3. Docker Compose plugin (公式 plugin を /usr/libexec/docker/cli-plugins/ に配置)
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
chown -R ec2-user:ec2-user "$APP_DIR"

# 5. compose 起動 (build に時間がかかるため非同期 / ログは journald に流れる)
cd "$APP_DIR"
docker compose -f compose.prod.yaml up -d --build
