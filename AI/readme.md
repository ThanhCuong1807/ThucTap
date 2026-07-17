# AI Sandbox for Phishing URL Detection using Deep Learning

## 📌 Project Overview

This project develops an AI-based Sandbox system capable of detecting phishing websites using a **1D Convolutional Neural Network (1D-CNN)** model. The system analyzes URLs and webpage content to classify websites as **Legitimate** or **Phishing**.

The application is deployed on **Amazon EC2**, while **Amazon CloudWatch** is used for monitoring logs and system performance.

---

## 🚀 Features

- Detect phishing URLs using Deep Learning (1D-CNN)
- Analyze webpage content (HTML, Forms, JavaScript, Links)
- Trusted Website Whitelist
- AI Sandbox running on AWS EC2
- CloudWatch monitoring
- URL preprocessing and prediction
- Easy deployment using Python

---

## 🛠 Technologies Used

### Programming Language

- Python 3.12

### Deep Learning

- TensorFlow
- Keras
- 1D Convolutional Neural Network (1D-CNN)

### Libraries

- pandas
- requests
- beautifulsoup4
- lxml
- tldextract
- scikit-learn
- numpy

### Cloud Services

- Amazon EC2
- Amazon CloudWatch
- IAM Role
- Security Group
- Elastic IP

---

## 📂 Project Structure

```
MoHinhHocSau/
│
├── dataset/
│
├── models/
│   ├── tokenizer.pkl
│   └── url_phishing_cnn.keras
│
├── notebooks/
│
├── predict.py
├── web_analyzer.py
│
└── README.md
```

---

## ⚙ Installation

### Clone Repository

```bash
git clone https://github.com/your-account/your-project.git

cd your-project
```

### Create Virtual Environment

```bash
python3 -m venv venv
```

Activate

Linux

```bash
source venv/bin/activate
```

Windows

```cmd
venv\Scripts\activate
```

---

### Install Dependencies

```bash
pip install tensorflow pandas requests beautifulsoup4 lxml scikit-learn tldextract
```

---

## ▶ Run

```bash
python3 predict.py
```

---

## AWS Deployment

The AI model is deployed on **Amazon EC2 Ubuntu 24.04**.

Deployment includes:

- Upload source code
- Python Virtual Environment
- TensorFlow installation
- Model deployment
- CloudWatch monitoring

---

## Model Information

Architecture

- 1D Convolutional Neural Network (1D-CNN)

Input

- URL String

Output

- Legitimate Website
- Phishing Website

---

## Dataset

The model is trained using a phishing URL dataset containing:

- Legitimate URLs
- Phishing URLs

Data preprocessing includes:

- URL cleaning
- Character Tokenization
- Sequence Padding

---

## Project Workflow

```
URL
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

## Monitoring

Amazon CloudWatch is used to monitor:

- AI Logs
- CPU Usage
- Memory Usage
- Disk Usage
- Network Usage

---

## Future Improvements

- REST API integration
- Docker deployment
- Kubernetes support
- Real-time phishing detection
- Browser Extension

---

## Author

Nguyễn Lê Thanh Cường

HUTECH University

Major: Information Security

---

## License

This project is developed for educational and research purposes.