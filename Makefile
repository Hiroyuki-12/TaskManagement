.PHONY: build release deploy redeploy destroy ssh logs status clean

RELEASE_TAG := latest
JAR_SRC := backend/build/libs/task-management-backend-0.0.1-SNAPSHOT.jar

# JAR をビルドし backend/app.jar に配置 (compose.prod.yaml ローカル検証用も兼ねる)
build:
	cd backend && ./gradlew bootJar
	cp $(JAR_SRC) backend/app.jar
	@ls -lh backend/app.jar

# JAR を GitHub Releases にアップロード (なければ作成)
release: build
	@if gh release view $(RELEASE_TAG) >/dev/null 2>&1; then \
		echo "updating existing release $(RELEASE_TAG)..."; \
		gh release upload $(RELEASE_TAG) backend/app.jar --clobber; \
	else \
		echo "creating release $(RELEASE_TAG)..."; \
		gh release create $(RELEASE_TAG) backend/app.jar --title "Latest build" --notes "auto-generated"; \
	fi
	@echo "release URL: $$(gh release view $(RELEASE_TAG) --json url -q .url)"

# 初回 / EC2 が無い状態からのデプロイ
deploy:
	cd infra && terraform apply

# user_data に変更がない時に EC2 だけ作り直し (新しい JAR を取得させたい時)
redeploy:
	cd infra && terraform apply -replace=aws_instance.app

# 全リソース削除 (課題提出後)
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
	ssh -i ~/.ssh/taskmanagement-key.pem ec2-user@$$DNS 'cd /opt/taskmanagement && sudo docker compose -f compose.prod.yaml ps'

# ローカル成果物の掃除
clean:
	rm -f backend/app.jar
	cd backend && ./gradlew clean
