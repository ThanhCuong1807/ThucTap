# AI Sandbox for Phishing URL Detection using Deep Learning

## 📖 Project Overview

This project develops an AI-based Sandbox system capable of detecting phishing websites using **Deep Learning (1D Convolutional Neural Network - 1D-CNN)**. The system analyzes URLs and webpage content to classify websites into **Legitimate** or **Phishing**.

The AI model is deployed on **Amazon Web Services (AWS)**, specifically on **Amazon EC2**, while **Amazon CloudWatch** is used to monitor system logs and resource usage.

---

# 🎯 Objectives

- Detect phishing websites using Deep Learning.
- Analyze webpage content before classification.
- Deploy the AI model on AWS EC2.
- Build a secure AI Sandbox environment.
- Monitor the AI system using Amazon CloudWatch.

---

# ✨ Features

- Phishing URL Detection using 1D-CNN
- Web Content Analysis
- Trusted Website Whitelist
- URL Preprocessing
- AI Prediction
- AWS EC2 Deployment
- Amazon CloudWatch Monitoring

---

# 🛠 Technologies Used

## Programming Language

- Python 3.12

## Deep Learning

- TensorFlow 2.21
- Keras
- 1D Convolutional Neural Network (1D-CNN)

## Python Libraries

- pandas
- numpy
- requests
- beautifulsoup4
- lxml
- tldextract
- scikit-learn

## Cloud Services

- Amazon EC2
- Amazon VPC
- Amazon EBS
- Amazon CloudWatch
- IAM Role
- Security Group
- Elastic IP

---

# 📂 Project Structure

```
ThucTap-main/
│
├── dataset/
│   ├── phishing_site_urls.csv
│   └── top-1m.csv
│
├── models/
│   ├── tokenizer.pkl
│   └── url_phishing_cnn.keras
│
├── notebooks/
│   └── url_phishing.ipynb
│
├── predict.py
├── web_analyzer.py
├── README.md
│
└── requirements.txt
```

---

# 🧠 Deep Learning Model

Model Architecture

- 1D Convolutional Neural Network (1D-CNN)

Input

- URL String

Output

- Legitimate Website
- Phishing Website

Performance Evaluation

- Accuracy
- Precision
- Recall
- F1-score

---

# 📊 Dataset

The model is trained using a phishing URL dataset consisting of:

- Legitimate URLs
- Phishing URLs

Data preprocessing includes:

- URL Cleaning
- Character Tokenization
- Sequence Padding
- Label Encoding

---

# 🌐 AI Detection Workflow

```
User URL
    │
    ▼
Whitelist Check
    │
    ▼
Web Analyzer
    │
    ▼
Tokenizer
    │
    ▼
1D-CNN Model
    │
    ▼
Prediction
    │
    ▼
Legitimate / Phishing
```

---

# ☁ AWS Deployment

The AI Sandbox is deployed on **Amazon Web Services (AWS)**.

## AWS Services Used

- Amazon EC2
- Amazon VPC
- Amazon EBS
- Security Group
- IAM Role
- Elastic IP
- Amazon CloudWatch

---

# 🖥 EC2 Environment

| Component | Description |
|------------|-------------|
| Operating System | Ubuntu 24.04 LTS |
| Python | Python 3.12 |
| Framework | TensorFlow 2.21 |
| Cloud Platform | Amazon EC2 |
| Storage | Amazon EBS |
| Monitoring | Amazon CloudWatch |

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/your-organization/aws-PhanTichvaPhatHienMaDoc.git

cd aws-PhanTichvaPhatHienMaDoc
```

---

## Create Virtual Environment

Linux

```bash
python3 -m venv venv

source venv/bin/activate
```

Windows

```cmd
python -m venv venv

venv\Scripts\activate
```

---

## Install Dependencies

```bash
pip install tensorflow pandas requests beautifulsoup4 lxml scikit-learn tldextract
```

or

```bash
pip install -r requirements.txt
```

---

# ▶ Run Project

```bash
python3 predict.py
```

---

# 📊 CloudWatch Monitoring

Amazon CloudWatch is used to monitor the AI Sandbox.

Collected Metrics

- CPU Utilization
- Memory Usage
- Disk Usage
- Network Traffic
- AI Application Logs

---

# 🏗 AWS Architecture

```
                 Internet
                     │
                     ▼
             Security Group
                     │
                     ▼
          Amazon EC2 (Ubuntu 24.04)
                     │
      ┌──────────────┴──────────────┐
      │                             │
      ▼                             ▼
 TensorFlow Model          Amazon CloudWatch
      │                             │
      └──────────────┬──────────────┘
                     ▼
        Phishing URL Detection
```

---

# 📌 AWS Deployment Features

- Deploy AI model on Amazon EC2
- Configure Security Group
- Configure IAM Role
- Store project on Amazon EBS
- Monitor AI logs using Amazon CloudWatch
- Support scalable cloud deployment

---

# 🚀 Future Improvements

- REST API Integration
- Docker Deployment
- Kubernetes Deployment
- Browser Extension
- Real-time Phishing Detection
- Automatic Model Retraining

---

# 👨‍💻 Author

**Nguyễn Lê Thanh Cường**

HUTECH University

Major: Information Security

---

# 📄 License

This project is developed for educational and research purposes.