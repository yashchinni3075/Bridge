import * as UserService from "../services/user.service.js";

export function getAllUsers(req, res) {
  const users = UserService.getAllUsers();

  res.status(200).json({
    success: true,
    data: users,
  });
}

export function getUserById(req, res) {
  const user = UserService.getUserById(Number(req.params.id));

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
}

export function createUser(req, res) {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: "Name and email are required",
    });
  }

  const existingUser = UserService.getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  const newUser = UserService.createUser({ name, email });

  res.status(201).json({
    success: true,
    data: newUser,
  });
}

export function updateUser(req, res) {
  const updatedUser = UserService.updateUser(Number(req.params.id), req.body);

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    data: updatedUser,
  });
}

export function deleteUser(req, res) {
  const deleted = UserService.deleteUser(Number(req.params.id));

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(204).send();
}
