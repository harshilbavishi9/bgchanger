# Product Background Batch Generator

A high-performance web application built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Sharp**, and **Archiver** for batch generating product image variations across customizable color background collections.

---

## ⚡ Key Features

- **Batch Product Image Upload**: Drag-and-drop PNG product images with instant thumbnail previews.
- **Independent Background Toggle**: Enable or disable background replacement per product.
- **2,000 Studio Color Backgrounds**: Soft, light studio backdrops (studio white, warm champagne, ice blue, pastel mint, lavender, and radial softbox gradients).
- **Randomized Color Sampling**: Draws distinct studio colors on every execution run.
- **1:1 Square Studio Canvas (1200x1200px)**: Product scale expanded to **96% max bounds** for maximum visual prominence.
- **Soft Studio Drop Shadow**: Adds a blurred drop shadow underneath the product base to ground it realistically.
- **Instant Speed & Format Controls**: Hardware-accelerated **JPEG** (~1.5ms per image), **WebP**, and **PNG** export options.
- **Vercel Deployment Ready**: Serverless `/tmp` storage routing and zero-CPU ZIP store mode.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

```bash
# Install dependencies
npm install

# Run local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📦 Production Build

```bash
npm run build
npm start
```

---

## 🌐 Deploy to Vercel

```bash
npm install -g vercel
vercel
```
