import { Request, Response } from "express";
import { AdminService } from "./admin.service";

const adminService = new AdminService();

export class AdminController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await adminService.getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve users." });
    }
  }
}
