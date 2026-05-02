.PHONY: build-backend build-frontend build release deploy redeploy destroy ssh logs status clean

RELEASE_TAG := latest
JAR_SRC := backend/build/libs/task-management-backend-0.0.1-SNAPSHOT.jar
FRONT_DIST := frontend/dist
FRONT_TARBALL := frontend-dist.tar.gz

# バックエンド JAR をビルド
build-backend:
	cd backend && ./gradlew bootJar
	cp $(JAR_SRC) backend/app.jar
	@ls -lh backend/app.jar

# フロント dist をビルドして tarball 化
build-frontend:
	cd frontend && npm install --no-audit --no-fund && npm run build
	tar -czf $(FRONT_TARBALL) -C frontend dist
	@ls -lh $(FRONT_TARBALL)

# 両方ビルド
build: build-backend build-frontend

# 成果物を GitHub Releases にアップロード (release "latest" を更新)
release: build
	@if gh release view $(RELEASE_TAG) >/dev/null 2>&1; then \
		echo "updating release $(RELEASE_TAG)..."; \
		gh release upload $(RELEASE_TAG) backend/app.jar $(FRONT_TARBALL) --clobber; \
	else \
		echo "creating release $(RELEASE_TAG)..."; \
		gh release create $(RELEASE_TAG) backend/app.jar $(FRONT_TARBALL) --title "Latest build" --notes "auto-generated"; \
	fi
	@echo "release URL: $$(gh release view $(RELEASE_TAG) --json url -q .url)"

# 初回 / EC2 が無い状態からのデプロイ
deploy:
	cd infra && terraform apply

# user_data に変更がない時に EC2 だけ作り直し (新しい release を取得させたい時)
redeploy:
	cd infra && terraform apply -replace=aws_instance.app

# 全リソース削除
destroy:
	cd infra && terraform destroy

# EC2 へ SSH
ssh:
	@cd infra && eval $$(terraform output -raw ssh_command)

# EC2 上のコンテナログ
logs:
	@DNS=$$(cd infra && terraform output -raw ec2_public_dns); \
	ssh -i ~/.ssh/taskmanagement-key.pem ec2-user@$$DNS 'cd /opt/taskmanagement && sudo docker compose -f compose.prod.yaml logs --tail=100 -f'

# EC2 上のコンテナ状態
status:
	@DNS=$$(cd infra && terraform output -raw ec2_public_dns); \
	ssh -i ~/.ssh/taskmanagement-key.pem ec2-user@$$DNS 'cd /opt/taskmanagement && sudo docker compose -f compose.prod.yaml ps; echo; sudo systemctl is-active nginx'

clean:
	rm -f backend/app.jar $(FRONT_TARBALL)
	cd backend && ./gradlew clean
