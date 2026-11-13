// Compatibility shim: firebase_core's BuildConfigGenerator references JavaWriter from
// an old AGP version. Adding javawriter to the buildscript classpath prevents the
// NoClassDefFoundError: com/squareup/javawriter/JavaWriter at build time.
buildscript {
    repositories {
        mavenCentral()
        google()
    }
    dependencies {
        classpath("com.squareup:javawriter:2.5.1")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
