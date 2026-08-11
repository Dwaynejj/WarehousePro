# Build a runnable Spring Boot JAR, then run on a slim JRE image.
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render (and most PaaS) inject PORT; default 8080 for local docker runs.
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=supabase
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -jar app.jar"]
