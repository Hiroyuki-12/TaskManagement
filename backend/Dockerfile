# syntax=docker/dockerfile:1.7
#
# 事前にローカルで `./gradlew bootJar` を実行し、生成された JAR を
# `backend/app.jar` として配置してから docker build すること。
# user_data.sh では GitHub Releases から取得して配置する。

FROM eclipse-temurin:25-jre
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app app

COPY app.jar /app/app.jar
RUN chown app:app /app/app.jar
USER app

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
