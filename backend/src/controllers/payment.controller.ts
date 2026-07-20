import { Request, Response, NextFunction } from "express";
import * as service from "../services/payment.service";
const bid = (req: Request) => req.user!.businessId;
export const getAll = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getAll(bid(req), req.query) }); } catch (error) { next(error); } };
export const getById = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getById(bid(req), req.params.id) }); } catch (error) { next(error); } };
export const create = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json({ success: true, message: "Customer payment recorded.", data: await service.create(bid(req), req.user!.userId, req.body) }); } catch (error) { next(error); } };
export const reverse = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: "Customer payment reversed.", data: await service.reverse(bid(req), req.params.id) }); } catch (error) { next(error); } };
