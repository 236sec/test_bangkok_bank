pipeline {
    agent any

    tools {
        nodejs 'node22'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            parallel {
                stage('Backend') {
                    stages {
                        stage('Backend Install') {
                            steps {
                                dir('backend') {
                                    sh 'npm ci'
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
                    }
                }

                stage('Frontend') {
                    stages {
                        stage('Frontend Install') {
                            steps {
                                dir('frontend') {
                                    sh 'npm ci'
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
                        stage('Frontend E2E Tests') {
                            steps {
                                dir('frontend') {
                                    sh 'npm run cypress:run'
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
