import jetbrains.buildServer.configs.kotlin.v2019_2.*
import jetbrains.buildServer.configs.kotlin.v2019_2.buildFeatures.commitStatusPublisher
import jetbrains.buildServer.configs.kotlin.v2019_2.buildSteps.script
import jetbrains.buildServer.configs.kotlin.v2019_2.projectFeatures.buildReportTab
import jetbrains.buildServer.configs.kotlin.v2019_2.triggers.vcs

/*
The settings script is an entry point for defining a TeamCity
project hierarchy. The script should contain a single call to the
project() function with a Project instance or an init function as
an argument.

VcsRoots, BuildTypes, Templates, and subprojects can be
registered inside the project using the vcsRoot(), buildType(),
template(), and subProject() methods respectively.

To debug settings scripts in command-line, run the

    mvnDebug org.jetbrains.teamcity:teamcity-configs-maven-plugin:generate

command and attach your debugger to the port 8000.

To debug in IntelliJ Idea, open the 'Maven Projects' tool window (View
-> Tool Windows -> Maven Projects), find the generate task node
(Plugins -> teamcity-configs -> teamcity-configs:generate), the
'Debug' option is available in the context menu for the task.
*/

version = "2020.2"

project {

    buildType(Tests)
    buildType(Build)

    params {
        param("env.CI", "true")
    }

    features {
        feature {
            id = "PROJECT_EXT_2"
            type = "IssueTracker"
            param("secure:password", "")
            param("name", "wKich/creevey")
            param("pattern", """#(\d+)""")
            param("authType", "anonymous")
            param("repository", "https://github.com/wKich/creevey")
            param("type", "GithubIssues")
            param("secure:accessToken", "")
            param("username", "")
        }
        buildReportTab {
            id = "PROJECT_EXT_3"
            title = "Creevey"
            startPage = "report.zip!index.html"
        }
    }
}

object Build : BuildType({
    name = "Build"

    artifactRules = "creevey-*.tgz"

    vcs {
        root(DslContext.settingsRoot)
    }

    steps {
        script {
            name = "install"
            scriptContent = "yarn"
        }
        script {
            name = "lint"
            scriptContent = "yarn lint"
        }
        script {
            name = "build"
            scriptContent = "yarn build"
        }
        script {
            name = "pack"
            scriptContent = "yarn pack"
        }
    }

    triggers {
        vcs {
        }
    }

    features {
        commitStatusPublisher {
            publisher = github {
                githubUrl = "https://api.github.com"
                authType = personalToken {
                    token = "credentialsJSON:43d7baea-a084-42de-8862-7d191a694a60"
                }
            }
            param("github_oauth_user", "wKich")
        }
    }
})

object Tests : BuildType({
    name = "Tests"

    artifactRules = "report => report.zip"

    vcs {
        root(DslContext.settingsRoot)
    }

    steps {
        script {
            name = "git lfs"
            scriptContent = "git lfs install"
        }
        script {
            name = "install"
            scriptContent = "yarn"
        }
        script {
            name = "unit tests"
            scriptContent = "yarn test:unit"
        }
        script {
            name = "storybook"
            scriptContent = "nohup yarn start:storybook > /dev/null 2>&1 </dev/null &"
        }
        script {
            name = "screenshot tests"
            scriptContent = "yarn creevey"
        }
    }

    triggers {
        vcs {
        }
    }

    features {
        commitStatusPublisher {
            publisher = github {
                githubUrl = "https://api.github.com"
                authType = personalToken {
                    token = "credentialsJSON:43d7baea-a084-42de-8862-7d191a694a60"
                }
            }
            param("github_oauth_user", "wKich")
        }
    }

    dependencies {
        artifacts(Build) {
            buildRule = lastSuccessful()
            artifactRules = "creevey-*.tgz!/package/lib/client/web/main.js => report"
        }
    }
})
