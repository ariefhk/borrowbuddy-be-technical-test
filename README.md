# BorrowBuddy - Backend Technical Test

## Tech Stack

- Express Js
- Prisma ORM
- PostgreSQL

## Technical Docs

1. Swagger Docs

   - http://{{host}}/api/docs

2. DB Diagram
   [Link to DB Diagram](https://dbdiagram.io/d/BorrowBuddy-Backend-technical-test-668cc1009939893dae669684)

3. Unit Testing (Integration Testing API)

   - Borrow Test
   - ![Borrow Test](/test/example/borrow-test.png)
   - Book Test
   - ![Book Test](/test/example/book-test.png)
   - Penalty Test
   - ![Penalty Test](/test/example/penalty-test.png)
   - User Test
   - ![User Test](/test/example/user-test.png)

## Entities

- User (Admin / Member) -> Implemented RBAC feature
- Book

## Use Case

- Members can borrow books with conditions
  - [ ] Members may not borrow more than 2 books
  - [ ] Borrowed books are not borrowed by other members
  - [ ] Member is currently not being penalized
- Member returns the book with conditions
  - [ ] The returned book is a book that the member has borrowed
  - [ ] If the book is returned after more than 7 days, the member will be subject to a penalty. Member with penalty cannot able to borrow the book for 3 days
- Check the book
  - [ ] Shows all existing books and quantities
  - [ ] Books that are being borrowed are not counted
- Member check
  - [ ] Shows all existing members
  - [ ] The number of books being borrowed by each member
- Admin
  - [ ] Can Manage User
  - [ ] Can Manage Book
  - [ ] Can Manage Borrow
  - [ ] Can Manage Penalty

## Extras

1. RBAC feature (ADMIN / Member Role Access)
2. Service Repository Pattern combining prisma ORM
3. Rate Limiter for public endpoint

## How To Run

1. Install Library

```bash
pnpm i
```

2. Create an .env file on root folder

```bash
DATABASE_URL=
JWT_SECRET_TOKEN=
```

3. Create Database

```bash
pnpm db:push
```

4. Create Seed

```bash
pnpm db:seed
```

5. Running Project on development

```bash
pnpm dev
```
