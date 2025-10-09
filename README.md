# 🛍️ WP Product Uploader — React + TypeScript + JWT

Ứng dụng web cho phép **đăng nhập bằng JWT**, **upload hình ảnh**, và **tạo sản phẩm mới** lên **WordPress / WooCommerce** thông qua REST API.

---

## 🚀 Tech Stack

* ⚛️ **React + TypeScript + Vite**
* 🎨 **Tailwind CSS + HeroUI**
* 🧠 **Zustand** (state management)
* 🔐 **JWT Authentication** (WordPress REST API)
* 🧩 **Axios** (API client)

---

## 🧩 Cài đặt & Chạy dự án

```bash
# 1️⃣ Clone repo
 git clone https://github.com/yourusername/wp-product-uploader.git
 cd wp-product-uploader

# 2️⃣ Cài dependencies
 npm install

# 3️⃣ Chạy dev server
 npm run dev
```

Mở trình duyệt tại:
👉 [http://localhost:5173](http://localhost:5173)

---

## 🔐 Quy trình hoạt động

1. **Đăng nhập JWT:**

    * Gửi `POST /wp-json/jwt-auth/v1/token` với username + password.
    * Nhận `token` → lưu trong Zustand + localStorage.

2. **Upload hình ảnh:**

    * Gửi `POST /wp-json/wp/v2/media` với Header `Authorization: Bearer <token>`.
    * Nhận `mediaId` để gắn vào sản phẩm.

3. **Tạo sản phẩm:**

    * Gửi `POST /wp-json/wc/v3/products` với JSON gồm `name`, `description`, `categories`, `images`, `price`, v.v.

---

## 🧠 Tính năng chính

* ✅ Đăng nhập / lưu JWT token tự động.
* 🖼️ Upload ảnh lên media library của WP.
* 🧾 Form tạo sản phẩm (tên, mô tả, danh mục, ảnh, giá...)
* 🔄 Tự động gắn danh mục cha - con.
* ⚡ UI nhẹ, responsive (HeroUI + Tailwind).
* 🧩 State management đơn giản, dễ mở rộng (Zustand).

---

## 🧪 Cấu hình WordPress cần có

* WordPress >= 6.0
* WooCommerce >= 8.0
* Plugin JWT Authentication for WP-API
  *(Cần chỉnh `.htaccess` hoặc Nginx để bật header `Authorization`)*

Ví dụ `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule .* - [e=HTTP_AUTHORIZATION:%1]
```

---

## 🧱 API Endpoints chính

| Tính năng    | Endpoint                             | Mô tả                    |
| ------------ | ------------------------------------ | ------------------------ |
| Login        | `/wp-json/jwt-auth/v1/token`         | Lấy token đăng nhập      |
| Upload Media | `/wp-json/wp/v2/media`               | Upload ảnh lên thư viện  |
| Tạo sản phẩm | `/wp-json/wc/v3/products`            | Tạo sản phẩm WooCommerce |
| Lấy danh mục | `/wp-json/wc/v3/products/categories` | Lấy danh mục sản phẩm    |

---

## 🧰 Build Production

```bash
npm run build
```

Output build sẽ nằm trong thư mục `dist/`.

---

## 👨‍💻 Tác giả

**Nguyễn Văn Dũng**
📧 [vandunxg@duck.com](mailto:vandunxg@duck.com)
---

## 🪪 Giấy phép

MIT License © 2025 Nguyễn Văn Dũng
