# Construction Material Supplier ERP - Backend MVP

This is the backend server supporting user accounts, JWT token authorization, business isolation, and inventory tracking.

## Technology Stack
- Node.js
- Express
- TypeScript
- Prisma ORM & SQLite
- Zod Request Validations
- bcrypt & JSON Web Tokens

## Setup Commands

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**
   Create a `backend/.env` file:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="local_development_jwt_secret_construction_erp_key"
   JWT_EXPIRES_IN="7d"
   PORT=5000
   FRONTEND_URL="http://localhost:5173"
   ```

3. **Prisma Migrations & Client Generation**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Seed Database**
   ```bash
   npm run prisma:seed
   ```

5. **Start Server**
   - Development mode: `npm run dev`
   - Production mode: `npm run build && npm run start`

## Test Login Credentials
- **Email**: `admin@shrikrishnatraders.com`
- **Password**: `Admin@123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create business & Admin user
- `POST /api/auth/login` - Obtain JWT session token
- `GET /api/auth/me` - Fetch authenticated user details

### Business Settings
- `GET /api/business` - Get company profile info
- `PATCH /api/business` - Edit company details (Name, GSTIN, Address, Phone) - Admin Only

### Inventory Tracking
- `GET /api/inventory` - Get items (supports filters: `search`, `category`, `location`, `stockStatus=low`)
- `GET /api/inventory/:id` - Fetch item details
- `POST /api/inventory` - Add new item
- `PUT /api/inventory/:id` - Edit item parameters
- `DELETE /api/inventory/:id` - Remove item
- `PATCH /api/inventory/:id/stock` - Adjust stock (Stock-in / Stock-out movements)
- `GET /api/inventory/:id/transactions` - Fetch transaction adjustments history
