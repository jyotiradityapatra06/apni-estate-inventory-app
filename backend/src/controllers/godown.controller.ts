import { Request, Response, NextFunction } from "express";
import * as service from "../services/godown.service";
const bid = (req: Request) => req.user!.businessId;
export const getAll = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getAll(bid(req)) }); } catch (e) { next(e); } };
export const getById = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getById(bid(req), req.params.id) }); } catch (e) { next(e); } };
export const create = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json({ success: true, message: "Godown created successfully.", data: await service.create(bid(req), req.user!.userId, req.body) }); } catch (e) { next(e); } };
export const update = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: "Godown updated successfully.", data: await service.update(bid(req), req.user!.userId, req.params.id, req.body) }); } catch (e) { next(e); } };
export const remove = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: "Godown deactivated successfully.", data: await service.remove(bid(req), req.params.id) }); } catch (e) { next(e); } };
