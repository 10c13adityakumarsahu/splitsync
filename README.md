# SplitSync

SplitSync is a modern, mobile-first expense sharing application with a unique, secure, and gateway-free UPI settlement flow.

## 🚀 Features
- **Mobile First Design:** Extremely clean, fluid, and responsive UI inspired by CRED & Splitwise.
- **Dynamic Splits:** Split expenses equally, by exact amount, or percentages.
- **Custom Settlement Flow:** Secure `upi://pay` deeplinks. Share via WhatsApp for manual confirmation. No payment gateway needed!
- **JWT Authentication:** Secure backend API using Django REST Framework.

## 🛠 Tech Stack
**Frontend:** React, Vite, Tailwind CSS, Framer Motion, React Query, Axios.
**Backend:** Django, Django REST Framework, SQLite (PostgreSQL ready).

## 🏃‍♂️ Getting Started

### Using Docker
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/`

### Manual Setup

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
python manage.py migrate
python manage.py runserver
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 📸 Core Flows
1. **Add Expense:** Select a group and enter the amount. Choose your split strategy.
2. **Settle Up:** Generate a secure payment link.
3. **Confirm Payment:** Payer uses their UPI app, clicks "I Have Paid", and receiver locks the transaction!

Enjoy your split syncing!
