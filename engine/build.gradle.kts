plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.spatialos.engine"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // ARCore — Spatial tracking, plane detection, anchors
    implementation("com.google.ar:core:1.44.0")

    // Filament — PBR 3D rendering
    // Using SceneView which bundles Filament + gltfio + ARCore integration
    implementation("io.github.sceneview:arsceneview:2.2.1")

    // MediaPipe Tasks Vision — Hand tracking (21 landmarks, LIVE_STREAM mode)
    implementation("com.google.mediapipe:tasks-vision:0.10.14")

    // Flutter embedding — ONLY in bridge/ module
    // Provided by host Flutter app at runtime when embedded
    // compileOnly("io.flutter:flutter_embedding_debug:...")

    // Kotlin coroutines for async pipeline coordination
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}

