pipeline {
    agent any

    triggers {
        githubPush()
    }

    tools {
        nodejs 'node24'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    if (env.CHANGE_ID) {
                        githubNotify status: 'PENDING', description: 'CI pipeline started'
                    }
                }
            }
        }

        stage('Execute CI/CD') {
            when {
                anyOf {
                    branch 'main'
                    changeRequest()
                }
            }
            
            stages {
                // --- BACKEND STAGES ---
                stage('Backend Install') {
                    steps {
                        dir('backend') {
                            sh 'npm install'
                            sh 'DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate'
                        }
                    }
                }
                stage('Backend Lint') {
                    steps {
                        dir('backend') {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Backend Unit Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm run test'
                        }
                    }
                }
                stage('Backend Build') {
                    steps {
                        dir('backend') {
                            sh 'npm run build'
                        }
                    }
                }

                // --- FRONTEND STAGES ---
                stage('Frontend Install') {
                    steps {
                        dir('frontend') {
                            sh 'npm install'
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('frontend') {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Frontend Unit Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm run test'
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                if (env.CHANGE_ID) {
                    githubNotify status: 'SUCCESS', description: 'All checks passed'
                }
            }
        }
        failure {
            script {
                if (env.CHANGE_ID) {
                    githubNotify status: 'FAILURE', description: 'CI pipeline failed'
                }
            }
        }
        always {
            cleanWs()
        }
    }
}