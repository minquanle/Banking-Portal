<img width="1080" height="474" alt="image" src="https://github.com/user-attachments/assets/bdc4f42d-a269-4ab2-9119-debab864125c" />
# 🏦 Open Source Banking Portal

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions)](https://github.com/minquanle/Banking-Portal/actions)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Deployed-326CE5?style=for-the-badge&logo=kubernetes)](./k8s)
[![Java Backend](https://img.shields.io/badge/Backend-Java-ED8B00?style=for-the-badge&logo=java)](./BankingPortal-API)
[![TypeScript Frontend](https://img.shields.io/badge/Frontend-TypeScript-3178C6?style=for-the-badge&logo=typescript)](./BankingPortal-UI)

Chào mừng bạn đến với **Banking Portal** – một dự án Web Ngân hàng mã nguồn mở (Open Source) được thiết kế theo kiến trúc Microservices/Tách biệt (Frontend & Backend). 

Điểm nhấn đặc biệt của dự án này là hệ thống **CI/CD Pipeline toàn diện** được xây dựng bằng GitHub Actions, tự động hóa hoàn toàn quy trình kiểm thử, đóng gói (Docker) và triển khai lên cụm **Kubernetes (K8s)**.

---

## 📑 Mục lục

- [Kiến trúc Dự án](#-kiến-trúc-dự-án)
- [Hệ thống CI/CD Pipeline](#-hệ-thống-cicd-pipeline)
- [Công nghệ Sử dụng](#-công-nghệ-sử-dụng)
- [Hướng dẫn Chạy Local](#-hướng-dẫn-chạy-local)
- [Các Tính năng & Bản vá Gần đây](#-các-tính-năng--bản-vá-gần-đây)
- [Đóng góp (Contributing)](#-đóng-góp-contributing)

---

## 🏗 Kiến trúc Dự án

Dự án được tổ chức theo mô hình Monorepo, bao gồm mã nguồn ứng dụng và toàn bộ cấu hình hạ tầng (Infrastructure as Code):

- **`.github/workflows/`**: Nơi chứa các kịch bản (scripts) định nghĩa Pipeline CI/CD tự động của GitHub Actions.
- **`BankingPortal-API/`**: Thư mục chứa mã nguồn Backend (được viết bằng Java), cung cấp các RESTful API cốt lõi cho nghiệp vụ ngân hàng.
- **`BankingPortal-UI/`**: Thư mục chứa mã nguồn Frontend (TypeScript, HTML, CSS), cung cấp giao diện tương tác cho người dùng.
- **`k8s/`**: Các file manifest (YAML) để triển khai ứng dụng lên Kubernetes bao gồm Deployment, Service, Ingress, v.v.

---

## ⚙️ Hệ thống CI/CD Pipeline

Dự án áp dụng phương pháp phát triển phần mềm hiện đại với luồng CI/CD được thiết lập tự động mỗi khi có thay đổi trên nhánh `main`:

### 1. Continuous Integration (CI)
- **Trigger**: Kích hoạt khi có thao tác `push` hoặc `pull_request` vào nhánh `main`.
- **Backend Test & Build**: Biên dịch mã nguồn Java, chạy các Unit Test đảm bảo logic nghiệp vụ ngân hàng (như giao dịch, tính toán số dư) không bị lỗi.
- **Frontend Test & Build**: Kiểm tra cú pháp TypeScript và build ra các file tĩnh.

### 2. Continuous Delivery & Deployment (CD)
- **Dockerization**: Nếu các bước CI thành công, pipeline sẽ tự động build Docker Image cho cả `BankingPortal-API` và `BankingPortal-UI`.
- **Registry Push**: Đẩy (push) các image vừa tạo lên Container Registry.
- **Kubernetes Deployment**: Cập nhật phiên bản tag mới nhất vào các file cấu hình trong thư mục `k8s/` và tự động apply lên cụm Kubernetes. Quá trình này đảm bảo Zero-downtime (không gián đoạn dịch vụ) khi cập nhật phiên bản mới.

---

## 💻 Công nghệ Sử dụng

* **Backend:** Java (Spring Boot / Framework tương đương)
* **Frontend:** TypeScript, HTML, CSS (Framework UI hiện đại)
* **DevOps & Tự động hóa:**
  * **CI/CD:** GitHub Actions
  * **Containerization:** Docker
  * **Orchestration:** Kubernetes (K8s)

---
