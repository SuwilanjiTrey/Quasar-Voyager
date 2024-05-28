plugins {
    alias(libs.plugins.jvm)
    application
}

repositories {
    mavenCentral()
}
 
dependencies {
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation(libs.junit.jupiter.engine)
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    implementation(libs.guava)

    implementation("io.ktor:ktor-server-core:1.6.4")
    implementation("io.ktor:ktor-server-netty:1.6.4")
    implementation("io.ktor:ktor-html-builder:1.6.4")
    implementation("org.jetbrains.kotlinx:kotlinx-html-jvm:0.7.2")
    implementation("io.ktor:ktor-gson:1.6.4")

    // SQLite and Exposed dependencies
    implementation("org.xerial:sqlite-jdbc:3.34.0")
    implementation("com.zaxxer:HikariCP:4.0.3") 
    implementation("org.jetbrains.exposed:exposed-core:0.34.1")
    implementation("org.jetbrains.exposed:exposed-dao:0.34.1")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.34.1")
    implementation("org.jetbrains.exposed:exposed-java-time:0.34.1")
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

application {
    mainClass.set("ApplicationKt")
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}
