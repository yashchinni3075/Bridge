# 🤝 Contributing Guidelines

Welcome to the project! Please follow the guidelines below to ensure smooth collaboration.

## 📌 Repository Workflow

* The `main` branch is the stable branch.
* **Do not commit or push directly to the `main` branch.**
* Every member must create and work on their own feature branch.

---

## 🌿 Creating Your Branch

After cloning the repository, create your own branch:

```bash
git checkout -b feature-yourname
```

Example:

```bash
git checkout -b feature-onkar
```

or create a branch based on your feature:

```bash
git checkout -b feature-login
```

---

## 🔄 Before You Start Working

Always update your local `main` branch before starting work:

```bash
git checkout main
git pull origin main
git checkout feature-yourname
git merge main
```

---

## 💻 While Working

Commit your changes regularly with meaningful commit messages.

Example:

```bash
git add .
git commit -m "Added user authentication"
git push origin feature-yourname
```

---

## 🚫 Important Rules

* ❌ Do NOT commit directly to the `main` branch.
* ❌ Do NOT push directly to the `main` branch.
* ❌ Do NOT merge your branch into `main`.
* ❌ Do NOT delete another member's branch.
* ❌ Do NOT overwrite another member's code without discussing it first.

---

## ✅ After Completing Your Task

1. Push your latest changes to your feature branch.
2. Inform the project maintainer that your feature is ready.
3. The maintainer will review your code and merge it into `main` if everything is correct.

---

## 📝 Commit Message Examples

```
Added login functionality
Fixed navbar responsiveness
Implemented dashboard API
Updated README
Fixed payment validation bug
```

---

## 📂 Branch Naming Convention

Use one of the following formats:

```
feature-login
feature-dashboard
feature-payment
feature-chatbot
feature-yourname
bugfix-login
```

---

## 🤝 Team Collaboration

* Pull the latest changes from `main` before starting new work.
* Keep your branch focused on a single feature whenever possible.
* Test your code before pushing.
* Communicate with the team if your changes affect shared files.

Let's keep the repository clean, organized, and easy to maintain. Happy coding! 🚀


