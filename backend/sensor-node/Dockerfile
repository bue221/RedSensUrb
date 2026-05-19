FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY . /app
RUN mvn -q -f /app/pom.xml -pl sensor-node -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/sensor-node/target/sensor-node-0.1.0-SNAPSHOT-jar-with-dependencies.jar app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]
