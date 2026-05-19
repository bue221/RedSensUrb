FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY . /app
RUN mvn -q -f /app/pom.xml -pl shared-contracts,coordinator -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/coordinator/target/coordinator-0.1.0-SNAPSHOT.jar app.jar
EXPOSE 8080 9000/udp
ENTRYPOINT ["java","-Dorg.springframework.boot.logging.LoggingSystem=none","-jar","/app/app.jar"]
