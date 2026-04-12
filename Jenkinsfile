pipeline {
    agent any

    environment {
        DEPLOY_HOST = 'ubuntu@172.17.0.1'
        PROJECT_DIR = '/home/ubuntu/MedRag'
    }

    stages {

        stage('Pull latest code') {
            steps {
                sshagent(['ec2-deploy-key']) {
                    sh 'ssh -o StrictHostKeyChecking=no $DEPLOY_HOST "cd $PROJECT_DIR && git pull origin main"'
                }
            }
        }

        stage('Build frontend') {
            steps {
                sshagent(['ec2-deploy-key']) {
                    sh '''ssh -o StrictHostKeyChecking=no $DEPLOY_HOST "
                        set -e
                        cd $PROJECT_DIR/frontend
                        npm install
                        npm run build
                        cp -r dist/. /var/www/medrag/
                    "'''
                }
            }
        }

        stage('Rebuild & restart backend') {
            steps {
                sshagent(['ec2-deploy-key']) {
                    sh '''ssh -o StrictHostKeyChecking=no $DEPLOY_HOST "
                        set -e
                        cd $PROJECT_DIR
                        docker compose -f docker-compose.prod.yml build
                        docker compose -f docker-compose.prod.yml up -d
                    "'''
                }
            }
        }
    }

    post {
        success { echo 'Deployment SUCCESSFUL — app is live!' }
        failure { echo 'Deployment FAILED. Click Console Output for details.' }
    }
}
